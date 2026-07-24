import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- Set test env vars ----
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock";
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_mock";

// ---- Mock @/lib/stripe ----
const mockPaymentIntents = vi.hoisted(() => ({
  create: vi.fn(),
  retrieve: vi.fn(),
}));
const mockWebhooks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    paymentIntents: mockPaymentIntents,
    webhooks: mockWebhooks,
  },
  createPaymentIntent: vi.fn(),
  retrievePaymentIntent: vi.fn(),
  constructWebhookEvent: vi.fn(),
}));

// ---- Mock @/lib/auth ----
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// ---- Mock @/lib/prisma ----
const mockPrisma = {
  booking: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  payment: {
    findFirst: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
};

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// ---- Mock @/lib/rate-limit ----
vi.mock("@/lib/rate-limit", () => ({
  paymentRateLimit: {},
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
}));

// ---- Mock next/headers ----
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { auth } from "@/lib/auth";
import { createPaymentIntent } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const { POST, PUT } = await import("@/app/api/payments/stripe/route");

function createMockRequest({
  method = "POST",
  body = {},
  headers = {},
}: {
  method?: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
}) {
  return {
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(JSON.stringify(body)),
    headers: new Map(Object.entries(headers)),
  } as any;
}

describe("POST /api/payments/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    (auth as any).mockResolvedValue({
      user: { id: "user-123", email: "test@example.com" },
    });

    // Default: no rate limit
    (checkRateLimit as any).mockResolvedValue({ success: true });

    // Default: booking exists, belongs to user, awaiting payment
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "booking-123",
      userId: "user-123",
      totalPrice: 1500,
      status: "AWAITING_PAYMENT",
      trekSlug: "everest-base-camp",
    });

    // Default: payment intent created successfully
    (createPaymentIntent as any).mockResolvedValue({
      id: "pi_test_created",
      client_secret: "pi_test_created_secret",
    });

    // Default: prisma operations succeed
    mockPrisma.payment.upsert.mockResolvedValue({ id: "payment-123" });
    mockPrisma.booking.update.mockResolvedValue({});
  });

  it("returns 401 when user is not authenticated", async () => {
    (auth as any).mockResolvedValue(null);

    const req = createMockRequest({ body: { bookingId: "booking-123" } });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 when bookingId is missing", async () => {
    const req = createMockRequest({ body: {} });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Booking ID required");
  });

  it("returns 404 when booking does not exist", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue(null);

    const req = createMockRequest({ body: { bookingId: "booking-404" } });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Booking not found");
  });

  it("returns 404 when booking belongs to another user", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "booking-123",
      userId: "other-user", // different from authenticated user
      totalPrice: 1500,
      status: "AWAITING_PAYMENT",
      trekSlug: "everest-base-camp",
    });

    const req = createMockRequest({ body: { bookingId: "booking-123" } });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Booking not found");
  });

  it("returns 400 when booking is not eligible for payment", async () => {
    mockPrisma.booking.findUnique.mockResolvedValue({
      id: "booking-123",
      userId: "user-123",
      totalPrice: 1500,
      status: "CONFIRMED", // already confirmed, not eligible
      trekSlug: "everest-base-camp",
    });

    const req = createMockRequest({ body: { bookingId: "booking-123" } });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Booking is not eligible for payment");
  });

  it("creates a payment intent successfully (defaults to FULL)", async () => {
    const req = createMockRequest({ body: { bookingId: "booking-123" } });
    const res = await POST(req);
    const data = await res.json();

    expect(createPaymentIntent).toHaveBeenCalledWith(
      1500,
      "usd",
      expect.objectContaining({
        bookingId: "booking-123",
        userId: "user-123",
        trekSlug: "everest-base-camp",
      })
    );

    expect(mockPrisma.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bookingId: "booking-123" },
        create: expect.objectContaining({ amount: 1500 }),
        update: expect.objectContaining({ amount: 1500 }),
      })
    );

    expect(mockPrisma.booking.update).toHaveBeenCalledWith({
      where: { id: "booking-123" },
      data: { status: "AWAITING_PAYMENT" },
    });

    expect(data).toEqual({
      clientSecret: "pi_test_created_secret",
      paymentIntentId: "pi_test_created",
    });
  });

  it("charges full amount when paymentType is FULL", async () => {
    const req = createMockRequest({
      body: { bookingId: "booking-123", paymentType: "FULL" },
    });
    const res = await POST(req);
    const data = await res.json();

    expect(createPaymentIntent).toHaveBeenCalledWith(
      1500,
      "usd",
      expect.any(Object)
    );

    expect(mockPrisma.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ amount: 1500 }),
      })
    );

    expect(data).toEqual({
      clientSecret: "pi_test_created_secret",
      paymentIntentId: "pi_test_created",
    });
  });

  it("charges 20% when paymentType is ADVANCE", async () => {
    const req = createMockRequest({
      body: { bookingId: "booking-123", paymentType: "ADVANCE" },
    });
    const res = await POST(req);
    const data = await res.json();

    // 20% of 1500 = 300
    expect(createPaymentIntent).toHaveBeenCalledWith(
      300,
      "usd",
      expect.any(Object)
    );

    expect(mockPrisma.payment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ amount: 300 }),
      })
    );

    expect(data).toEqual({
      clientSecret: "pi_test_created_secret",
      paymentIntentId: "pi_test_created",
    });
  });

  it("handles rate limiting", async () => {
    (checkRateLimit as any).mockResolvedValue({ success: false });

    const req = createMockRequest({ body: { bookingId: "booking-123" } });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(data.error).toBe("Too many requests");
  });

  it("returns 500 when payment creation fails", async () => {
    (createPaymentIntent as any).mockRejectedValue(new Error("Stripe API error"));

    const req = createMockRequest({ body: { bookingId: "booking-123" } });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Payment processing failed");
  });
});

describe("PUT /api/payments/stripe (webhook)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles payment_intent.succeeded event", async () => {
    mockWebhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: { id: "pi_succeeded_123" },
      },
    });

    mockPrisma.payment.findFirst.mockResolvedValue({
      id: "payment-123",
      bookingId: "booking-123",
      stripePaymentIntentId: "pi_succeeded_123",
    });

    mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));

    const req = createMockRequest({
      method: "PUT",
      body: { type: "payment_intent.succeeded" },
      headers: { "stripe-signature": "test_sig" },
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(mockWebhooks.constructEvent).toHaveBeenCalled();
    expect(mockPrisma.payment.findFirst).toHaveBeenCalledWith({
      where: { stripePaymentIntentId: "pi_succeeded_123" },
    });
    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "payment-123" },
        data: { status: "SUCCEEDED" },
      })
    );
    expect(mockPrisma.booking.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "booking-123" },
        data: { status: "CONFIRMED", paymentStatus: "FULLY_PAID" },
      })
    );
    expect(data).toEqual({ received: true });
  });

  it("handles payment_intent.payment_failed event", async () => {
    mockWebhooks.constructEvent.mockReturnValue({
      type: "payment_intent.payment_failed",
      data: {
        object: { id: "pi_failed_123" },
      },
    });

    mockPrisma.payment.findFirst.mockResolvedValue({
      id: "payment-456",
      bookingId: "booking-456",
      stripePaymentIntentId: "pi_failed_123",
    });

    const req = createMockRequest({
      method: "PUT",
      body: { type: "payment_intent.payment_failed" },
      headers: { "stripe-signature": "test_sig" },
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "payment-456" },
        data: { status: "FAILED" },
      })
    );
    expect(data).toEqual({ received: true });
  });

  it("ignores unknown event types gracefully", async () => {
    mockWebhooks.constructEvent.mockReturnValue({
      type: "charge.refunded",
      data: { object: { id: "ch_refunded" } },
    });

    const req = createMockRequest({
      method: "PUT",
      body: { type: "charge.refunded" },
      headers: { "stripe-signature": "test_sig" },
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(mockPrisma.payment.findFirst).not.toHaveBeenCalled();
    expect(data).toEqual({ received: true });
  });

  it("returns 400 when webhook signature verification fails", async () => {
    mockWebhooks.constructEvent.mockImplementation(() => {
      throw new Error("Signature verification failed");
    });

    const req = createMockRequest({
      method: "PUT",
      body: {},
      headers: { "stripe-signature": "bad_sig" },
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Webhook error");
  });

  it("does nothing if no payment record matches the payment intent", async () => {
    mockWebhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: { id: "pi_unknown" },
      },
    });

    mockPrisma.payment.findFirst.mockResolvedValue(null);

    const req = createMockRequest({
      method: "PUT",
      body: { type: "payment_intent.succeeded" },
      headers: { "stripe-signature": "test_sig" },
    });

    const res = await PUT(req);
    const data = await res.json();

    expect(mockPrisma.payment.update).not.toHaveBeenCalled();
    expect(mockPrisma.booking.update).not.toHaveBeenCalled();
    expect(data).toEqual({ received: true });
  });
});
