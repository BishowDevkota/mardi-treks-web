"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Loader2, Minus, Users, Calendar, Package, AlertCircle } from "lucide-react";
import { travelerDetailSchema } from "@/lib/validations";

interface TravelerForm {
  fullName: string;
  email: string;
  phone: string;
  nationality: string;
  emergencyContact: string;
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
  searchParams: Promise<{ travelers?: string; addons?: string; startDate?: string }>;
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
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Parse available addons from trek data
  const trekAddons: { title: string; description: string; unit: string; pricePerUnit: number }[] =
    trek?.addons ? (() => { try { return JSON.parse(trek.addons); } catch { return []; } })() : [];

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
          emergencyContact: "",
          age: "",
        },
      ]);
      if (sp.startDate) setStartDate(sp.startDate);
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

  // Calculate price per person from pricing tiers based on group size
  function getPriceForGroupSize(): number {
    if (!trek?.pricingTiers?.length) return trek?.price || 0;
    for (const tier of trek.pricingTiers) {
      const match = tier.groupSize.match(/(\d+)/);
      if (match) {
        const min = parseInt(match[1]);
        const maxMatch = tier.groupSize.match(/-?\s*(\d+)/g);
        const max = maxMatch && maxMatch.length > 1 ? parseInt(maxMatch[1].replace(/[-\s]/g, '')) : min;
        if (travelerCount >= min && travelerCount <= max) return tier.pricePerPerson;
      }
    }
    return trek.pricingTiers[trek.pricingTiers.length - 1]?.pricePerPerson || trek.price || 0;
  }

  const pricePerPerson = getPriceForGroupSize();
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

  // Only one lead traveler form is shown; the traveler count is used for pricing only
  function removeTraveler(index: number) {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((_, i) => i !== index));
    }
  }

  function updateTraveler(index: number, field: keyof TravelerForm, value: string) {
    const updated = [...travelers];
    updated[index] = { ...updated[index], [field]: value };
    setTravelers(updated);
    // Clear the error for this field when user types
    const errorKey = `travelers.${index}.${field}`;
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next[errorKey];
      return next;
    });
  }

  function getFieldError(index: number, field: keyof TravelerForm): string | undefined {
    return formErrors[`travelers.${index}.${field}`];
  }

  function isFieldTouched(index: number, field: keyof TravelerForm): boolean {
    return touchedFields.has(`travelers.${index}.${field}`);
  }

  function markFieldTouched(index: number, field: keyof TravelerForm) {
    setTouchedFields((prev) => {
      const next = new Set(prev);
      next.add(`travelers.${index}.${field}`);
      return next;
    });
    // Validate the single field
    const traveler = travelers[index];
    const result = travelerDetailSchema.shape[field as keyof typeof travelerDetailSchema.shape]?.safeParse(
      traveler[field]
    );
    if (!result?.success) {
      const issue = result?.error?.issues?.[0];
      setFormErrors((prev) => ({
        ...prev,
        [`travelers.${index}.${field}`]: issue?.message || "Invalid value",
      }));
    } else {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[`travelers.${index}.${field}`];
        return next;
      });
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    const allTouched = new Set(touchedFields);

    // Validate start date
    if (!startDate) {
      errors.startDate = "Please select a start date";
    } else {
      const selected = new Date(startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        errors.startDate = "Start date cannot be in the past";
      }
    }

    // Validate each traveler
    travelers.forEach((traveler, i) => {
      const fields: (keyof TravelerForm)[] = ["fullName", "email", "phone", "nationality"];
      fields.forEach((field) => {
        const errorKey = `travelers.${i}.${field}`;
        allTouched.add(errorKey);
        const result = travelerDetailSchema.shape[field].safeParse(traveler[field]);
        if (!result.success) {
          errors[errorKey] = result.error.issues[0]?.message || "This field is required";
        }
      });

      // Validate email separately with full email schema
      if (traveler.email) {
        const emailResult = travelerDetailSchema.shape.email.safeParse(traveler.email);
        if (!emailResult.success) {
          errors[`travelers.${i}.email`] = emailResult.error.issues[0]?.message || "Invalid email";
        }
      }

      // Optional fields — only flag if they have a value that's invalid
      if (traveler.age) {
        const age = parseInt(traveler.age);
        if (isNaN(age) || age < 1 || age > 120) {
          errors[`travelers.${i}.age`] = "Age must be between 1 and 120";
        }
      }
    });

    setFormErrors(errors);
    setTouchedFields(allTouched);
    return Object.keys(errors).length === 0;
  }

  function scrollToFirstError() {
    const firstErrorField = document.querySelector('[data-error="true"]');
    if (firstErrorField) {
      firstErrorField.scrollIntoView({ behavior: "smooth", block: "center" });
      (firstErrorField as HTMLElement).focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !trek) return;

    if (!validateForm()) {
      scrollToFirstError();
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
          trekPrice: pricePerPerson,
          trekDuration: trek.duration,
          startDate,
          groupSize: travelerCount,
          addons: selectedAddons,
          specialRequests,
          travelers: travelers.map((t) => ({
            fullName: t.fullName,
            email: t.email,
            phone: t.phone,
            nationality: t.nationality,
            emergencyContact: t.emergencyContact || undefined,
            age: t.age ? parseInt(t.age) : null,
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
      <div className="flex min-h-[60vh] items-center justify-center" style={{ backgroundColor: "var(--color-background)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-primary)" }} />
      </div>
    );
  }

  if (!trek) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" style={{ backgroundColor: "var(--color-background)" }}>
        <p style={{ color: "var(--color-text-muted)" }}>Trek not found</p>
      </div>
    );
  }

  const inputStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-surface)",
    color: "var(--color-foreground)",
  };

  const travelerInputStyle = {
    borderColor: "var(--color-border)",
    backgroundColor: "white",
    color: "var(--color-foreground)",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href={`/${trek.category?.slug || "treks"}/${slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {trek.title}
        </Link>

        <h1 className="text-3xl font-bold sm:text-4xl" style={{ color: "var(--color-secondary)" }}>
          Book Your Trek
        </h1>
        <p className="mt-2" style={{ color: "var(--color-text-muted)" }}>{trek.title}</p>

        <form onSubmit={handleSubmit} className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:items-start">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Date & Travelers */}
            <div
              className="rounded-3xl border p-6 sm:p-7"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <h2 className="text-lg font-bold" style={{ color: "var(--color-secondary)" }}>
                Date &amp; Travelers
              </h2>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    <Calendar className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setFormErrors((prev) => {
                        const next = { ...prev };
                        delete next.startDate;
                        return next;
                      });
                    }}
                    onBlur={() => {
                      if (!startDate) {
                        setFormErrors((prev) => ({ ...prev, startDate: "Please select a start date" }));
                      } else {
                        const selected = new Date(startDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        if (selected < today) {
                          setFormErrors((prev) => ({ ...prev, startDate: "Start date cannot be in the past" }));
                        } else {
                          setFormErrors((prev) => {
                            const next = { ...prev };
                            delete next.startDate;
                            return next;
                          });
                        }
                      }
                    }}
                    className="w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{
                      ...inputStyle,
                      borderColor: formErrors.startDate ? "var(--color-error)" : "var(--color-border)",
                    }}
                    data-error={formErrors.startDate ? "true" : undefined}
                  />
                  {formErrors.startDate && (
                    <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "var(--color-error)" }}>
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.startDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--color-foreground)" }}>
                    <Users className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                    Number of Travelers
                  </label>
                  <div
                    className="flex items-center justify-between rounded-xl border px-4 py-2"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "white" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const newCount = Math.max(1, travelerCount - 1);
                        setTravelerCount(newCount);
                      }}
                      disabled={travelerCount <= 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-secondary)" }}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-xl font-bold tabular-nums" style={{ color: "var(--color-foreground)" }}>
                      {travelerCount}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newCount = Math.min(trek.maxGroupSize || 20, travelerCount + 1);
                        setTravelerCount(newCount);
                      }}
                      disabled={travelerCount >= (trek.maxGroupSize || 20)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-secondary)" }}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Max {trek.maxGroupSize || 20} travelers per booking
                  </p>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            {trekAddons.length > 0 && (
              <div
                className="rounded-3xl border p-6 sm:p-7"
                style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
              >
                <h2 className="mb-4 flex items-center gap-1.5 text-lg font-bold" style={{ color: "var(--color-secondary)" }}>
                  <Package className="h-4 w-4" style={{ color: "var(--color-primary)" }} />
                  Add-ons
                </h2>
                <div className="space-y-3">
                  {trekAddons.map((addon, i) => {
                    const qty = selectedAddons.find((a) => a.title === addon.title)?.qty || 0;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-2xl border p-3"
                        style={{ borderColor: "var(--color-border)", backgroundColor: "white" }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium" style={{ color: "var(--color-foreground)" }}>{addon.title}</p>
                          {addon.description && (
                            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{addon.description}</p>
                          )}
                          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>${addon.pricePerUnit}/{addon.unit}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedAddons((prev) => {
                              const existing = prev.find((a) => a.title === addon.title);
                              if (existing && existing.qty <= 1) return prev.filter((a) => a.title !== addon.title);
                              return prev.map((a) => a.title === addon.title ? { ...a, qty: a.qty - 1 } : a);
                            })}
                            disabled={qty <= 0}
                            className="flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-secondary)" }}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold tabular-nums" style={{ color: "var(--color-foreground)" }}>
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedAddons((prev) => {
                              const existing = prev.find((a) => a.title === addon.title);
                              if (existing) return prev.map((a) => a.title === addon.title ? { ...a, qty: a.qty + 1 } : a);
                              return [...prev, { title: addon.title, qty: 1, pricePerUnit: addon.pricePerUnit }];
                            })}
                            className="flex h-7 w-7 items-center justify-center rounded-md border transition-colors"
                            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-secondary)" }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="w-16 shrink-0 text-right text-sm font-semibold tabular-nums" style={{ color: "var(--color-primary)" }}>
                          ${(qty * addon.pricePerUnit).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Lead Traveler Details — only one form, the count is used for pricing */}
            <div
              className="rounded-3xl border p-6 sm:p-7"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <h2 className="text-lg font-bold" style={{ color: "var(--color-secondary)" }}>
                Lead Traveler Details
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                {travelerCount > 1
                  ? `You're booking for ${travelerCount} travelers. We only need the lead traveler's contact info.`
                  : "We'll need some details for the booking."}
              </p>

              <div className="mt-5 space-y-4">
                {travelers.slice(0, 1).map((traveler, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border-2 p-5"
                    style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
                  >

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Full Name *</label>
                        <input
                          type="text"
                          required
                          value={traveler.fullName}
                          onChange={(e) => updateTraveler(index, "fullName", e.target.value)}
                          onBlur={() => markFieldTouched(index, "fullName")}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          style={{
                            ...travelerInputStyle,
                            borderColor: getFieldError(index, "fullName") ? "var(--color-error)" : "var(--color-border)",
                          }}
                          data-error={getFieldError(index, "fullName") ? "true" : undefined}
                        />
                        {isFieldTouched(index, "fullName") && getFieldError(index, "fullName") && (
                          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--color-error)" }}>
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError(index, "fullName")}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Email *</label>
                        <input
                          type="email"
                          required
                          value={traveler.email}
                          onChange={(e) => updateTraveler(index, "email", e.target.value)}
                          onBlur={() => markFieldTouched(index, "email")}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          style={{
                            ...travelerInputStyle,
                            borderColor: getFieldError(index, "email") ? "var(--color-error)" : "var(--color-border)",
                          }}
                          data-error={getFieldError(index, "email") ? "true" : undefined}
                        />
                        {isFieldTouched(index, "email") && getFieldError(index, "email") && (
                          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--color-error)" }}>
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError(index, "email")}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Phone *</label>
                        <input
                          type="tel"
                          required
                          value={traveler.phone}
                          onChange={(e) => updateTraveler(index, "phone", e.target.value)}
                          onBlur={() => markFieldTouched(index, "phone")}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          style={{
                            ...travelerInputStyle,
                            borderColor: getFieldError(index, "phone") ? "var(--color-error)" : "var(--color-border)",
                          }}
                          data-error={getFieldError(index, "phone") ? "true" : undefined}
                        />
                        {isFieldTouched(index, "phone") && getFieldError(index, "phone") && (
                          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--color-error)" }}>
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError(index, "phone")}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Nationality *</label>
                        <input
                          type="text"
                          required
                          value={traveler.nationality}
                          onChange={(e) => updateTraveler(index, "nationality", e.target.value)}
                          onBlur={() => markFieldTouched(index, "nationality")}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          style={{
                            ...travelerInputStyle,
                            borderColor: getFieldError(index, "nationality") ? "var(--color-error)" : "var(--color-border)",
                          }}
                          data-error={getFieldError(index, "nationality") ? "true" : undefined}
                        />
                        {isFieldTouched(index, "nationality") && getFieldError(index, "nationality") && (
                          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--color-error)" }}>
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError(index, "nationality")}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Emergency Contact</label>
                        <input
                          type="text"
                          value={traveler.emergencyContact}
                          onChange={(e) => updateTraveler(index, "emergencyContact", e.target.value)}
                          placeholder="Name &amp; phone number"
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          style={travelerInputStyle}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Age</label>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          value={traveler.age}
                          onChange={(e) => updateTraveler(index, "age", e.target.value)}
                          onBlur={() => markFieldTouched(index, "age")}
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          style={{
                            ...travelerInputStyle,
                            borderColor: getFieldError(index, "age") ? "var(--color-error)" : "var(--color-border)",
                          }}
                          data-error={getFieldError(index, "age") ? "true" : undefined}
                        />
                        {isFieldTouched(index, "age") && getFieldError(index, "age") && (
                          <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: "var(--color-error)" }}>
                            <AlertCircle className="h-3 w-3" />
                            {getFieldError(index, "age")}
                          </p>
                        )}
                      </div>
                    </div>

                    {index === 0 && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>Special Requests</label>
                        <textarea
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          rows={2}
                          placeholder="Dietary requirements, medical conditions, accommodation preferences..."
                          className="mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                          style={travelerInputStyle}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div
                className="flex items-start gap-2 rounded-2xl px-4 py-3 text-sm"
                style={{ backgroundColor: "var(--color-accent-light)", color: "var(--color-error)" }}
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Submit on mobile (summary card duplicates the button on desktop) */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {isSubmitting ? (
                <span className="inline-flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                </span>
              ) : (
                `Book Now - $${totalPrice.toLocaleString()}`
              )}
            </button>
          </div>

          {/* Summary sidebar */}
          <div className="lg:sticky lg:top-6">
            <div
              className="rounded-3xl border p-6 sm:p-7"
              style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <h2 className="text-lg font-bold" style={{ color: "var(--color-secondary)" }}>
                Booking Summary
              </h2>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                  <span style={{ color: "var(--color-text)" }}>Trek</span>
                  <span className="text-right font-medium" style={{ color: "var(--color-foreground)" }}>{trek.title}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                  <span style={{ color: "var(--color-text)" }}>Duration</span>
                  <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{trek.duration} days</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                  <span style={{ color: "var(--color-text)" }}>Price per person</span>
                  <span className="font-medium" style={{ color: "var(--color-foreground)" }}>${pricePerPerson.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                  <span style={{ color: "var(--color-text)" }}>Travelers</span>
                  <span className="font-medium" style={{ color: "var(--color-foreground)" }}>{travelerCount}</span>
                </div>
                {selectedAddons.map((addon, i) => (
                  <div key={i} className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--color-border)" }}>
                    <span style={{ color: "var(--color-text)" }}>{addon.title} &times; {addon.qty}</span>
                    <span className="font-medium" style={{ color: "var(--color-foreground)" }}>
                      +${(addon.qty * addon.pricePerUnit).toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1 text-lg font-bold">
                  <span style={{ color: "var(--color-foreground)" }}>Total</span>
                  <span style={{ color: "var(--color-primary)" }}>${totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 hidden w-full rounded-full px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:block"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" /> Processing...
                  </span>
                ) : (
                  `Book Now - $${totalPrice.toLocaleString()}`
                )}
              </button>
              <p className="mt-3 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
                No payment charged yet — you'll confirm on the next step
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}