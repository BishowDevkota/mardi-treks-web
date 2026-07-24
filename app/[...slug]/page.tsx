import { notFound } from "next/navigation";

/**
 * Catch-all route that returns a proper HTTP 404 for any unmatched path.
 * Without this, Next.js returns HTTP 200 for unknown routes because the
 * root not-found.tsx is served with a 200 status in some versions.
 *
 * This route is the lowest-priority matcher and only catches routes that
 * aren't matched by any more specific page (e.g., /[category], /blog, etc.).
 */
export default function CatchAllPage() {
  notFound();
}
