import Link from "next/link";
import type { Metadata } from "next";
import { Mountain, ArrowLeft, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "404 - Page Not Found | Mardi Treks",
  description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        {/* Mountain icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          <Mountain className="h-10 w-10 text-primary" />
        </div>

        <h1 className="mt-8 text-7xl font-black tracking-tight text-secondary">
          404
        </h1>
        <h2 className="mt-2 text-2xl font-bold text-foreground">
          Page Not Found
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Looks like this trail doesn&apos;t exist on our map. The page may have
          been moved, renamed, or is temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:from-primary-dark hover:to-primary-dark"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/treks"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-surface-alt"
          >
            <ArrowLeft className="h-4 w-4" />
            Browse Treks
          </Link>
        </div>

        <p className="mt-8 text-xs text-text-muted">
          If you believe this is an error,{" "}
          <Link
            href="/contact"
            className="font-medium text-primary underline decoration-primary/30 underline-offset-2 transition-colors hover:decoration-primary"
          >
            contact our support team
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
