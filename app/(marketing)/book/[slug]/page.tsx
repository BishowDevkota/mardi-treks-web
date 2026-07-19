"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";

// TODO: Fetch trek data from Payload CMS
const trekPrices: Record<string, { title: string; price: number; maxGroup: number }> = {
  "everest-base-camp": { title: "Everest Base Camp Trek", price: 1899, maxGroup: 12 },
  "annapurna-circuit": { title: "Annapurna Circuit Trek", price: 1599, maxGroup: 14 },
  "mardi-himal-trek": { title: "Mardi Himal Trek", price: 1199, maxGroup: 10 },
};

interface TravelerForm {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  passportNumber: string;
  age: string;
}

export default function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ travelers?: string; addons?: string }>;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [slug, setSlug] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<{ title: string; qty: number; pricePerUnit: number }[]>([]);
  const [travelerCount, setTravelerCount] = useState(1);
  const [travelers, setTravelers] = useState<TravelerForm[]>([]);

  // Initialize slug from params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Initialize travelers count and addons from search params
  // Only show 1 traveler form by default — users can add more via button
  useEffect(() => {
    searchParams.then((sp) => {
      const count = Math.min(Math.max(parseInt(sp.travelers || "1") || 1, 1), 20);
      setTravelerCount(count);
      setTravelers([
        { fullName: "", email: "", phone: "", nationality: "", passportNumber: "", age: "" },
      ]);
      if (sp.addons) {
        try {
          setSelectedAddons(JSON.parse(decodeURIComponent(sp.addons)));
        } catch {}
      }
    });
  }, [searchParams]);

  const trek = trekPrices[slug];
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.qty * a.pricePerUnit, 0);
  const totalPrice = trek ? trek.price * travelerCount + addonsTotal : 0;

  function addTraveler() {
    if (travelers.length < travelerCount) {
      setTravelers([...travelers, { fullName: "", email: "", phone: "", nationality: "", passportNumber: "", age: "" }]);
    }
  }

  function removeTraveler(index: number) {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((_, i) => i !== index));
    }
  }

  function updateTraveler(index: number, field: keyof TravelerForm, value: string) {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      router.push(`/login?callbackUrl=/book/${slug}`);
      return;
    }
    if (!trek) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trekSlug: slug,
          trekTitle: trek.title,
          trekPrice: trek.price,
          trekDuration: 14, // TODO: get from CMS
          startDate,
          groupSize: travelerCount,
          specialRequests,
          travelers: travelers.map((t) => ({
            ...t,
            age: t.age ? parseInt(t.age) : null,
            passportNumber: t.passportNumber || undefined,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create booking");
        return;
      }

      router.push(`/payment/${data.booking.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!trek) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-muted">Trek not found</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href={`/treks/${slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {trek.title}
      </Link>

      <h1 className="text-3xl font-bold text-foreground">Book Your Trek</h1>
      <p className="mt-2 text-text-muted">{trek.title}</p>

      {!session && (
        <div className="mt-6 rounded-lg border border-accent bg-amber-50 p-4 text-sm text-amber-800">
          You need to{" "}
          <Link href={`/login?callbackUrl=/book/${slug}`} className="font-medium underline">
            sign in
          </Link>{" "}
          or{" "}
          <Link href={`/signup?callbackUrl=/book/${slug}`} className="font-medium underline">
            create an account
          </Link>{" "}
          to complete your booking.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Trek Details Summary */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Booking Summary</h2>
          <div className="mt-4 flex items-center justify-between border-b border-border pb-4">
            <span className="text-text">Trek</span>
            <span className="font-medium text-foreground">{trek.title}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-b border-border pb-4">
            <span className="text-text">Price per person</span>
            <span className="font-medium text-foreground">${trek.price.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-b border-border pb-4">
            <span className="text-text">Travelers</span>
            <span className="font-medium text-foreground">{travelerCount}</span>
          </div>
          {selectedAddons.map((addon, i) => (
            <div key={i} className="mt-4 flex items-center justify-between border-b border-border pb-4">
              <span className="text-text">{addon.title} × {addon.qty}</span>
              <span className="font-medium text-foreground">+${(addon.qty * addon.pricePerUnit).toLocaleString()}</span>
            </div>
          ))}
          <div className="mt-4 flex items-center justify-between text-lg font-bold">
            <span className="text-foreground">Total</span>
            <span className="text-primary">${totalPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Date & Group Size */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Date & Group Size</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-foreground">
                Start Date *
              </label>
              <input
                id="startDate"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-end">
              <div className="w-full rounded-lg border border-border bg-surface px-4 py-2.5">
                <p className="text-xs text-text-muted">Travelers</p>
                <p className="text-lg font-bold text-foreground">{travelerCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Traveler Details */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Traveler Details</h2>
            {travelers.length < travelerCount && (
              <button
                type="button"
                onClick={addTraveler}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
              >
                <Plus className="h-4 w-4" />
                Add Traveler ({travelers.length}/{travelerCount})
              </button>
            )}
          </div>

          <div className="mt-4 space-y-6">
            {travelers.map((traveler, index) => (
              <div
                key={index}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Traveler {index + 1}
                  </span>
                  {travelers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTraveler(index)}
                      className="text-error hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-text-muted">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={traveler.fullName}
                      onChange={(e) => updateTraveler(index, "fullName", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={traveler.email}
                      onChange={(e) => updateTraveler(index, "email", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={traveler.phone}
                      onChange={(e) => updateTraveler(index, "phone", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">
                      Nationality *
                    </label>
                    <input
                      type="text"
                      required
                      value={traveler.nationality}
                      onChange={(e) => updateTraveler(index, "nationality", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">
                      Passport / ID Number
                    </label>
                    <input
                      type="text"
                      value={traveler.passportNumber}
                      onChange={(e) => updateTraveler(index, "passportNumber", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">Age</label>
                    <input
                      type="number"
                      min={1}
                      max={120}
                      value={traveler.age}
                      onChange={(e) => updateTraveler(index, "age", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Requests */}
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Special Requests</h2>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            rows={3}
            placeholder="Any dietary requirements, medical conditions, or special requests..."
            className="mt-4 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-error">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing...
            </span>
          ) : (
            `Book Now — $${totalPrice.toLocaleString()}`
          )}
        </button>
      </form>
    </div>
  );
}
