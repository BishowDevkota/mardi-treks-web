"use client";

import { useState, FormEvent } from "react";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function ContactFormSection({
  heading,
  description,
}: {
  heading?: string | null;
  description?: string | null;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: fd.get("name") as string,
      email: fd.get("email") as string,
      subject: fd.get("subject") as string,
      message: fd.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send message");
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {/* Heading */}
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {heading || "Ready for Your Himalayan Adventure?"}
            </h2>
            <p className="mt-4 text-lg text-text-muted">
              {description || "Have a question about a trek, need help planning your itinerary, or ready to book? Send us a message and we'll get back to you within 24 hours."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-10 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="block text-sm font-medium text-foreground">
                  Your Name *
                </label>
                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  required
                  className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-foreground">
                  Your Email *
                </label>
                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  required
                  className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="block text-sm font-medium text-foreground">
                Subject *
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="block text-sm font-medium text-foreground">
                Message *
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                className="mt-1.5 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 resize-y"
                placeholder="Tell us about your dream trek..."
              />
            </div>

            {/* Status messages */}
            {status === "success" && (
              <div className="flex items-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
                <CheckCircle className="h-5 w-5" />
                Message sent successfully! We&apos;ll get back to you soon.
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-2 rounded-xl bg-error/10 px-4 py-3 text-sm font-medium text-error">
                <AlertCircle className="h-5 w-5" />
                {errorMsg || "Failed to send message. Please try again."}
              </div>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
