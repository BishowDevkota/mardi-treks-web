import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mountain, Calendar, Users as UsersIcon, DollarSign, Clock } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
    AWAITING_PAYMENT: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
    COMPLETED: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
      <p className="mt-2 text-text-muted">
        Welcome back, {session.user.name || session.user.email}
      </p>

      {bookings.length === 0 ? (
        <div className="mt-12 text-center">
          <Mountain className="mx-auto h-16 w-16 text-text-muted/50" />
          <h2 className="mt-4 text-xl font-semibold text-foreground">No bookings yet</h2>
          <p className="mt-2 text-text-muted">
            Start your adventure by booking a trekking package.
          </p>
          <Link
            href="/treks"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Browse Treks
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="rounded-xl border border-border bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {booking.trekTitle}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(booking.startDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <UsersIcon className="h-4 w-4" />
                      {booking.groupSize} traveler{booking.groupSize > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      ${booking.totalPrice.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Booked {new Date(booking.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    statusColors[booking.status] || "bg-slate-100 text-slate-700"
                  }`}
                >
                  {booking.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
