import { createHash } from "node:crypto";
import { eq, refunds, webhookEvents } from "@chayan/db";
import { getServerEnv } from "@/env";
import { confirmPayment, markPaymentFailed } from "@/lib/bookings";
import { getDb } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/payments/signatures";

export const runtime = "nodejs";

type RazorpayEvent = {
  event: string;
  payload?: {
    payment?: {
      entity?: { id: string; order_id: string; method?: string; error_description?: string };
    };
    refund?: { entity?: { id: string; payment_id: string; status: string } };
  };
};

/**
 * Razorpay webhook. Configure it in the Razorpay dashboard with the events
 * payment.captured, payment.failed, refund.processed and refund.failed.
 * Every event is stored once; retries with the same event id are ignored.
 */
export async function POST(request: Request) {
  const secret = getServerEnv().RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature({ rawBody, signature, webhookSecret: secret })) {
    return new Response("Invalid signature", { status: 400 });
  }

  let event: RazorpayEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayEvent;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventId =
    request.headers.get("x-razorpay-event-id") ??
    `sha256:${createHash("sha256").update(rawBody).digest("hex")}`;

  const db = getDb();
  const inserted = await db
    .insert(webhookEvents)
    .values({ id: eventId, provider: "razorpay", type: event.event, payload: event })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  if (inserted.length === 0) return Response.json({ ok: true, duplicate: true });

  try {
    const payment = event.payload?.payment?.entity;
    const refund = event.payload?.refund?.entity;

    if ((event.event === "payment.captured" || event.event === "order.paid") && payment) {
      await confirmPayment({
        provider: "razorpay",
        orderId: payment.order_id,
        paymentId: payment.id,
        method: payment.method ?? null,
      });
    } else if (event.event === "payment.failed" && payment) {
      await markPaymentFailed({
        provider: "razorpay",
        orderId: payment.order_id,
        reason: payment.error_description ?? "Payment failed",
      });
    } else if ((event.event === "refund.processed" || event.event === "refund.failed") && refund) {
      await db
        .update(refunds)
        .set({ status: event.event === "refund.processed" ? "processed" : "failed" })
        .where(eq(refunds.providerRefundId, refund.id));
    }

    await db
      .update(webhookEvents)
      .set({ processedAt: new Date() })
      .where(eq(webhookEvents.id, eventId));
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Webhook processing failed", error);
    // Delete the record so Razorpay's retry is processed again.
    await db.delete(webhookEvents).where(eq(webhookEvents.id, eventId));
    return new Response("Processing failed", { status: 500 });
  }
}
