import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBookingSchema } from "@/lib/validations";
import { bookingRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { sendBookingNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = await checkRateLimit(bookingRateLimit, ip);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.reset),
            "X-RateLimit-Remaining": String(rateCheck.remaining),
          },
        }
      );
    }

    // Auth check — require login for booking
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to make a booking" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate input with Zod
    const validated = createBookingSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Invalid booking data",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      trekSlug,
      trekTitle,
      trekPrice,
      trekDuration,
      startDate,
      groupSize,
      addons,
      specialRequests,
      travelers,
    } = validated.data;

    // Validate start date is not in the past
    const parsedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parsedDate < today) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 }
      );
    }

    // Fetch the actual trek to validate against trek-specific constraints
    const trek = await prisma.trek.findUnique({ where: { slug: trekSlug } });
    if (!trek) {
      return NextResponse.json(
        { error: "Trek not found" },
        { status: 404 }
      );
    }

    // Validate group size doesn't exceed max group size
    if (groupSize > trek.maxGroupSize) {
      return NextResponse.json(
        {
          error: `Maximum ${trek.maxGroupSize} travelers allowed for this trek`,
        },
        { status: 400 }
      );
    }

    const addonsTotal = (addons || []).reduce((sum: number, a: any) => sum + a.qty * a.pricePerUnit, 0);
    const totalPrice = trekPrice * groupSize + addonsTotal;

    // Check availability (Prisma read, could also check Payload CMS date)
    // Check TrekAvailability table
    const availability = await prisma.trekAvailability.findUnique({
      where: {
        trekSlug_startDate: {
          trekSlug,
          startDate: new Date(startDate),
        },
      },
    });

    if (availability) {
      const seatsAvailable = availability.seatsTotal - availability.seatsBooked;
      if (seatsAvailable < groupSize) {
        return NextResponse.json(
          {
            error: `Only ${seatsAvailable} seat(s) available for this date`,
          },
          { status: 409 }
        );
      }
    }

    const userId = session.user.id!;

    // Verify the user exists before booking
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if (!userExists) {
      console.error(`Booking FK error: userId ${userId} not found in users table`);
      return NextResponse.json(
        { error: "User account not found. Please sign out and sign in again." },
        { status: 400 }
      );
    }

    // Create booking and travelers in a transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create the booking
      const newBooking = await tx.booking.create({
        data: {
          userId,
          trekSlug,
          trekTitle,
          trekPrice,
          trekDuration,
          startDate: new Date(startDate),
          groupSize,
          totalPrice,
          addons: addons && addons.length > 0 ? JSON.stringify(addons) : null,
          specialRequests: specialRequests || null,
          status: "PENDING_REVIEW",
          travelerDetails: {
            create: travelers.map((t) => ({
              fullName: t.fullName,
              email: t.email,
              phone: t.phone,
              nationality: t.nationality,
              emergencyContact: t.emergencyContact || null,
              age: t.age || null,
            })),
          },
        },
        include: {
          travelerDetails: true,
        },
      });

      // Update or create availability counter
      if (availability) {
        await tx.trekAvailability.update({
          where: { id: availability.id },
          data: {
            seatsBooked: availability.seatsBooked + groupSize,
          },
        });
      }

      return newBooking;
    });

    // Send email notification (non-blocking)
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
      if (user) {
        sendBookingNotification({
          customerName: user.name || "Unknown",
          customerEmail: user.email,
          trekTitle,
          startDate,
          travelers: travelers.map((t) => ({
            fullName: t.fullName,
            email: t.email,
            phone: t.phone,
            nationality: t.nationality,
            emergencyContact: t.emergencyContact,
            age: t.age,
          })),
          groupSize,
          totalPrice,
          addons: addons || [],
          specialRequests,
        }).catch((err) => console.error("Failed to send booking email:", err));
      }
    } catch (err) {
      console.error("Failed to send booking notification:", err);
    }

    return NextResponse.json(
      {
        booking: {
          id: booking.id,
          status: booking.status,
          totalPrice: booking.totalPrice,
          startDate: booking.startDate,
          groupSize: booking.groupSize,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET — fetch booking(s) for the current user
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("id");

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Single booking by ID (for payment page)
    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          trekTitle: true,
          trekPrice: true,
          totalPrice: true,
          startDate: true,
          groupSize: true,
          status: true,
          userId: true,
          addons: true,
          specialRequests: true,
          travelerDetails: {
            select: { fullName: true, email: true, phone: true, nationality: true, emergencyContact: true, age: true },
          },
          payment: { select: { status: true, method: true, amount: true } },
        },
      });

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      if (booking.userId !== session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }

      return NextResponse.json({ booking });
    }

    // All bookings for the current user (dashboard)
    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: { payment: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Booking GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
