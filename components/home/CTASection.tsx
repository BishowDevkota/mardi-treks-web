import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="bg-background py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ready for Your Himalayan Adventure?
        </h2>
        <p className="mt-4 text-lg text-text-muted">
          Whether you&apos;re a seasoned trekker or a first-timer, we have the perfect
          package for you. Let&apos;s make memories that last a lifetime.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary-dark"
          >
            Get in Touch
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/treks"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-base font-semibold text-text transition-all hover:bg-surface-alt"
          >
            Browse Treks
          </Link>
        </div>
      </div>
    </section>
  );
}
