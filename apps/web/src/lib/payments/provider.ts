import "server-only";
import { randomUUID } from "node:crypto";
import { getServerEnv } from "@/env";

export type ProviderName = "razorpay" | "mock";

export interface PaymentProvider {
  name: ProviderName;
  /** Public key for the browser checkout (Razorpay only). */
  publicKey: string | null;
  createOrder(input: {
    amountPaise: number;
    receipt: string;
    notes: Record<string, string>;
  }): Promise<{ orderId: string }>;
  refund(input: {
    paymentId: string;
    amountPaise: number;
    notes: Record<string, string>;
  }): Promise<{ refundId: string; status: "pending" | "processed" }>;
}

class RazorpayProvider implements PaymentProvider {
  readonly name = "razorpay" as const;
  constructor(
    readonly publicKey: string,
    private readonly secret: string,
  ) {}

  private async request<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`https://api.razorpay.com/v1${path}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.publicKey}:${this.secret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await response.json().catch(() => null)) as
      (T & { error?: { description?: string } }) | null;
    if (!response.ok || !data) {
      throw new Error(
        `Razorpay ${path} failed (${response.status}): ${data?.error?.description ?? "no details"}`,
      );
    }
    return data;
  }

  async createOrder(input: {
    amountPaise: number;
    receipt: string;
    notes: Record<string, string>;
  }) {
    const order = await this.request<{ id: string }>("/orders", {
      amount: input.amountPaise,
      currency: "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    });
    return { orderId: order.id };
  }

  async refund(input: { paymentId: string; amountPaise: number; notes: Record<string, string> }) {
    const refund = await this.request<{ id: string; status: string }>(
      `/payments/${encodeURIComponent(input.paymentId)}/refund`,
      { amount: input.amountPaise, speed: "normal", notes: input.notes },
    );
    return {
      refundId: refund.id,
      status: refund.status === "processed" ? ("processed" as const) : ("pending" as const),
    };
  }
}

/**
 * Test payments for local development without Razorpay keys. Never available
 * in production: env validation requires real keys there.
 */
class MockProvider implements PaymentProvider {
  readonly name = "mock" as const;
  readonly publicKey = null;

  async createOrder() {
    return { orderId: `mock_order_${randomUUID()}` };
  }

  async refund() {
    return { refundId: `mock_rfnd_${randomUUID()}`, status: "processed" as const };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const env = getServerEnv();
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    return new RazorpayProvider(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET);
  }
  if (env.NODE_ENV === "production") {
    throw new Error("Razorpay keys are missing in production");
  }
  return new MockProvider();
}
