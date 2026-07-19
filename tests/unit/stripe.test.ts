import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Stripe before importing the module
const mockPaymentIntents = vi.hoisted(() => ({
  create: vi.fn(),
  retrieve: vi.fn(),
}));

const mockWebhooks = vi.hoisted(() => ({
  constructEvent: vi.fn(),
}));

class MockStripe {
  paymentIntents = mockPaymentIntents;
  webhooks = mockWebhooks;
}

vi.mock("stripe", () => {
  return {
    default: MockStripe,
  };
});

// Set test env vars before importing
process.env.STRIPE_SECRET_KEY = "sk_test_mock_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_mock_secret";

const { stripe, createPaymentIntent, retrievePaymentIntent, constructWebhookEvent } = await import("@/lib/stripe");

describe("stripe client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes Stripe with the secret key", () => {
    expect(stripe).toBeDefined();
  });
});

describe("createPaymentIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a payment intent with correct amount in cents", async () => {
    const mockResult = {
      id: "pi_test_123",
      client_secret: "pi_test_123_secret_xyz",
      amount: 10000,
      currency: "usd",
    };
    mockPaymentIntents.create.mockResolvedValue(mockResult);

    const result = await createPaymentIntent(100, "usd", { bookingId: "booking-1" });

    expect(mockPaymentIntents.create).toHaveBeenCalledWith({
      amount: 10000, // 100 USD * 100 = 10000 cents
      currency: "usd",
      metadata: { bookingId: "booking-1" },
      automatic_payment_methods: { enabled: true },
    });
    expect(result).toEqual(mockResult);
  });

  it("converts decimal amounts to cents correctly", async () => {
    mockPaymentIntents.create.mockResolvedValue({ id: "pi_test_2" });

    await createPaymentIntent(2500.5, "usd");

    expect(mockPaymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 250050 })
    );
  });

  it("defaults to USD currency", async () => {
    mockPaymentIntents.create.mockResolvedValue({ id: "pi_test_3" });

    await createPaymentIntent(50);

    expect(mockPaymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "usd" })
    );
  });

  it("passes metadata to Stripe", async () => {
    mockPaymentIntents.create.mockResolvedValue({ id: "pi_test_4" });

    await createPaymentIntent(100, "usd", {
      bookingId: "booking-1",
      userId: "user-1",
      trekSlug: "everest-base-camp",
    });

    expect(mockPaymentIntents.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {
          bookingId: "booking-1",
          userId: "user-1",
          trekSlug: "everest-base-camp",
        },
      })
    );
  });

  it("throws when Stripe returns an error", async () => {
    mockPaymentIntents.create.mockRejectedValue(new Error("Stripe API error"));

    await expect(createPaymentIntent(100, "usd")).rejects.toThrow("Stripe API error");
  });
});

describe("retrievePaymentIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retrieves a payment intent by ID", async () => {
    const mockResult = {
      id: "pi_test_123",
      status: "succeeded",
      amount: 10000,
    };
    mockPaymentIntents.retrieve.mockResolvedValue(mockResult);

    const result = await retrievePaymentIntent("pi_test_123");

    expect(mockPaymentIntents.retrieve).toHaveBeenCalledWith("pi_test_123");
    expect(result).toEqual(mockResult);
  });

  it("throws when retrieval fails", async () => {
    mockPaymentIntents.retrieve.mockRejectedValue(new Error("Payment intent not found"));

    await expect(retrievePaymentIntent("pi_invalid")).rejects.toThrow("Payment intent not found");
  });
});

describe("constructWebhookEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("constructs a webhook event from payload and signature", () => {
    const mockEvent = {
      type: "payment_intent.succeeded",
      data: { object: { id: "pi_test_123" } },
    };
    mockWebhooks.constructEvent.mockReturnValue(mockEvent);

    const payload = JSON.stringify({ id: "evt_test" });
    const signature = "test_signature";

    const result = constructWebhookEvent(payload, signature);

    expect(mockWebhooks.constructEvent).toHaveBeenCalledWith(
      payload,
      signature,
      "whsec_mock_secret"
    );
    expect(result).toEqual(mockEvent);
  });

  it("throws when signature verification fails", () => {
    mockWebhooks.constructEvent.mockImplementation(() => {
      throw new Error("Signature verification failed");
    });

    expect(() =>
      constructWebhookEvent("{}", "bad_signature")
    ).toThrow("Signature verification failed");
  });
});
