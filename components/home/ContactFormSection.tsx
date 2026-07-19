"use client";

import { useState, FormEvent } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface InfoCard {
  title: string;
  description: string;
}

export function ContactFormSection({
  heading,
  description,
  infoCards,
}: {
  heading?: string | null;
  description?: string | null;
  infoCards?: InfoCard[] | null;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const cards = infoCards && infoCards.length > 0
    ? infoCards
    : [
        { title: "Fast response", description: "We usually reply within 24 hours with the next steps." },
        { title: "Tailor-made support", description: "Share your dates, group size, and ideas. We'll help shape the perfect trip." },
      ];

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, country, phone, subject, message }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send message");
      }

      setStatus("success");
      setName("");
      setEmail("");
      setCountry("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="overflow-hidden rounded-3xl bg-surface"
          style={{ border: "1px solid var(--color-border)", boxShadow: "0 25px 80px rgba(0, 0, 0, 0.08)" }}
        >
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            {/* Left Panel — Info Section */}
            <div
              className="relative overflow-hidden p-8 text-white md:p-10"
              style={{
                background: "linear-gradient(to bottom right, var(--color-secondary), var(--color-secondary-dark))",
              }}
            >
              {/* Primary color bubbles */}
              <div
                className="absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30"
                style={{ backgroundColor: "var(--color-primary)" }}
              />
              <div
                className="absolute -bottom-10 -left-10 h-36 w-36 rounded-full opacity-30"
                style={{ backgroundColor: "var(--color-primary)" }}
              />

              <div className="relative">
                <span
                  className="inline-flex rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em]"
                  style={{ borderColor: "rgba(255, 255, 255, 0.2)", backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                >
                  Contact Us
                </span>

                <h2 className="mt-5 text-3xl font-bold leading-tight md:text-4xl">
                  {heading || "Plan your next adventure with confidence."}
                </h2>

                {(description) && (
                  <p className="mt-4 max-w-md text-sm leading-7 md:text-base" style={{ color: "rgba(255, 255, 255, 0.9)" }}>
                    {description}
                  </p>
                )}

                {/* Dynamic Info Cards */}
                <div className="mt-8 space-y-4">
                  {cards.map((card, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
                    >
                      <p className="text-sm font-semibold">{card.title}</p>
                      <p className="mt-1 text-sm" style={{ color: "rgba(255, 255, 255, 0.85)" }}>
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel — Form */}
            <div className="p-6 md:p-10">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: "var(--color-foreground)" }}>
                    Send us a message
                  </h3>
                  <p className="mt-2 text-sm text-text-muted">
                    Fill in your details below and we&apos;ll reach out as soon as possible.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Name */}
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    Full name
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Your full name"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  {/* Email */}
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    Email address
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  {/* Country */}
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    Country
                    <input
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                      placeholder="Your country"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>

                  {/* Phone */}
                  <label className="space-y-1.5 text-sm font-medium text-foreground">
                    Phone number
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="Your phone number"
                      className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  </label>
                </div>

                {/* Subject */}
                <label className="block space-y-1.5 text-sm font-medium text-foreground">
                  Subject
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="How can we help you?"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </label>

                {/* Message */}
                <label className="block space-y-1.5 text-sm font-medium text-foreground">
                  Message
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={6}
                    placeholder="Tell us about your travel plan, preferred dates, group size, or any questions you have."
                    className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-foreground placeholder:text-text-muted outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y"
                  />
                </label>

                {/* Status messages */}
                {status === "success" && (
                  <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <CheckCircle className="h-5 w-5" />
                    Message sent successfully. We&apos;ll get back to you soon.
                  </div>
                )}

                {status === "error" && (
                  <div className="flex items-center gap-2 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
                    <AlertCircle className="h-5 w-5" />
                    {errorMsg || "Something went wrong. Please try again later."}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full rounded-2xl bg-primary px-6 py-3.5 font-semibold text-white shadow-lg transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status === "sending" ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      <Send className="h-5 w-5" />
                      Send Message
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
