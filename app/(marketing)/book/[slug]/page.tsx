"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, Minus, Users } from "lucide-react";

interface TravelerForm {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  passportNumber: string;
  age: string;
}

interface AvailableDate {
  startDate: string;
  seatsLeft: number;
}

interface TrekData {
  id: string;
  title: string;
  slug: string;
  price: number;
  duration: number;
  difficulty: string;
  maxGroupSize: number;
  addons: string | null;
  category: { slug: string; name: string } | null;
  pricingTiers: { groupSize: string; pricePerPerson: number }[];
  availableDates: AvailableDate[];
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
  const [trek, setTrek] = useState<TrekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<{ title: string; qty: number; pricePerUnit: number }[]>([]);
  const [travelerCount, setTravelerCount] = useState(1);
  const [travelers, setTravelers] = useState<TravelerForm[]>([]);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  useEffect(() => {
    if (!slug) return;
    async function fetchTrek() {
      try {
        const res = await fetch(`/api/trek?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          setTrek(data.trek);
        } else {
          setError("Trek not found");
        }
      } catch {
        setError("Failed to load trek data");
      } finally {
        setLoading(false);
      }
    }
    fetchTrek();
  }, [slug]);

  useEffect(() => {
    searchParams.then((sp) => {
      const count = Math.min(Math.max(parseInt(sp.travelers || "1") || 1, 1), 20);
      setTravelerCount(count);
      setTravelers([
        {
          fullName: session?.user?.name || "",
          email: session?.user?.email || "",
          phone: "",
          nationality: "",
          passportNumber: "",
          age: "",
        },
      ]);
      if (sp.addons) {
        try {
          setSelectedAddons(JSON.parse(decodeURIComponent(sp.addons)));
        } catch {}
      }
    });
  }, [searchParams, session]);

  useEffect(() => {
    if (!loading && !session && slug) {
      router.push(`/login?callbackUrl=/book/${slug}`);
    }
  }, [session, loading, slug, router]);

  const pricePerPerson = trek?.price || 0;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.qty * a.pricePerUnit, 0);
  const totalPrice = pricePerPerson * travelerCount + addonsTotal;

  const availableDates: { date: string; seatsLeft: number }[] = trek?.availableDates
    ? trek.availableDates
        .filter((ad) => ad.seatsLeft > 0 && new Date(ad.startDate) > new Date())
        .map((ad) => ({
          date: new Date(ad.startDate).toISOString().split("T")[0],
          seatsLeft: ad.seatsLeft,
        }))
    : [];

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
    if (!session || !trek) return;

    if (!startDate) {
      setError("Please select a start date");
      return;
    }

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
          trekDuration: trek.duration,
          startDate,
          groupSize: travelerCount,
          addons: selectedAddons,
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
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
        href={`/${trek.category?.slug || "treks"}/${slug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {trek.title}
      </Link>

      <h1 className="text-3xl font-bold text-foreground">Book Your Trek</h1>
      <p className="mt-2 text-text-muted">{trek.title}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Booking Summary</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-text">Trek</span>
              <span className="font-medium text-foreground">{trek.title}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-text">Duration</span>
              <span className="font-medium text-foreground">{trek.duration} days</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-text">Price per person</span>
              <span className="font-medium text-foreground">${pricePerPerson.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-text">Travelers</span>
              <span className="font-medium text-foreground">{travelerCount}</span>
            </div>
            {selectedAddons.map((addon, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-text">{addon.title} &times; {addon.qty}</span>
                <span className="font-medium text-foreground">+${(addon.qty * addon.pricePerUnit).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-lg font-bold pt-1">
              <span className="text-foreground">Total</span>
              <span className="text-primary">${totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Date &amp; Travelers</h2>
          <div className="mt-4 space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Start Date *</label>
              {availableDates.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableDates.map((ad) => (
                    <button
                      key={ad.date}
                      type="button"
                      onClick={() => setStartDate(ad.date)}
                      className={`rounded-lg border-2 p-3 text-left transition-all ${
                        startDate === ad.date
                          ? "border-teal-500 bg-teal-50"
                          : "border-border hover:border-teal-300"
                      }`}
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {new Date(ad.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {ad.seatsLeft} seat{ad.seatsLeft > 1 ? "s" : ""} left
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="date"
                  required
                  value={startDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-foreground mb-2">
                <Users className="h-4 w-4 text-teal-600" />
                Number of Travelers
              </label>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-2.5 max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    const newCount = Math.max(1, travelerCount - 1);
                    setTravelerCount(newCount);
                    if (travelers.length > newCount) {
                      setTravelers(travelers.slice(0, newCount));
                    }
                  }}
                  disabled={travelerCount <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-xl font-bold text-foreground tabular-nums">{travelerCount}</span>
                <button
                  type="button"
                  onClick={() => {
                    const newCount = Math.min(trek.maxGroupSize || 20, travelerCount + 1);
                    setTravelerCount(newCount);
                  }}
                  disabled={travelerCount >= (trek.maxGroupSize || 20)}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-text-muted mt-1">Max {trek.maxGroupSize || 20} travelers per booking</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Traveler Details</h2>
            {travelers.length < travelerCount && (
              <button type="button" onClick={addTraveler} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark">
                <Plus className="h-4 w-4" /> Add Traveler ({travelers.length}/{travelerCount})
              </button>
            )}
          </div>
          <div className="mt-4 space-y-6">
            {travelers.map((traveler, index) => (
              <div key={index} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Traveler {index + 1}</span>
                  {travelers.length > 1 && (
                    <button type="button" onClick={() => removeTraveler(index)} className="text-error hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-medium text-text-muted">Full Name *</label>
                    <input type="text" required value={traveler.fullName} onChange={(e) => updateTraveler(index, "fullName", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">Email *</label>
                    <input type="email" required value={traveler.email} onChange={(e) => updateTraveler(index, "email", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">Phone *</label>
                    <input type="tel" required value={traveler.phone} onChange={(e) => updateTraveler(index, "phone", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">Nationality *</label>
                    <input type="text" required value={traveler.nationality} onChange={(e) => updateTraveler(index, "nationality", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">Passport / ID Number</label>
                    <input type="text" value={traveler.passportNumber} onChange={(e) => updateTraveler(index, "passportNumber", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted">Age</label>
                    <input type="number" min={1} max={120} value={traveler.age} onChange={(e) => updateTraveler(index, "age", e.target.value)}
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                {index === 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-text-muted">Special Requests</label>
                    <textarea value={specialRequests} onChange={(e) => setSpecialRequests(e.target.value)} rows={2}
                      placeholder="Dietary requirements, medical conditions, accommodation preferences..."
                      className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-error">{error}</div>}

        <button type="submit" disabled={isSubmitting || !startDate}
          className="w-full rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Processing...</span>
          ) : (
            `Book Now - $${totalPrice.toLocaleString()}`
          )}
        </button>
      </form>
    </div>
  );
}
