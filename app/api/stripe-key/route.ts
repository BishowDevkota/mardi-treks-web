import { NextResponse } from "next/server";

// Exposes the Stripe publishable key to the client at runtime
// This avoids build-time inlining issues with NEXT_PUBLIC_ env vars on Vercel
export async function GET() {
  // Try NEXT_PUBLIC_ first (client-side var), then STRIPE_PUBLISHABLE_KEY (server-side var)
  const publishableKey =
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return NextResponse.json(
      { error: "Stripe publishable key is not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ publishableKey });
}
