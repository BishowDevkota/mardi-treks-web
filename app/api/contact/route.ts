import { NextRequest, NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";
import { contactRateLimit, checkRateLimit } from "@/lib/rate-limit";
import { contactFormSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateCheck = await checkRateLimit(contactRateLimit, ip);
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

    const body = await request.json();

    // Validate with Zod schema — includes length limits, email format, required fields
    const validated = contactFormSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, email, subject, message } = validated.data;

    await sendContactEmail({ name, email, subject, message });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 },
    );
  }
}
