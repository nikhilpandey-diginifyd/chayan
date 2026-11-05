import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualHex(expected: string, received: string): boolean {
  if (!/^[0-9a-f]+$/i.test(received)) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(received, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Razorpay Checkout success: HMAC-SHA256 of "order_id|payment_id" with the key secret. */
export function verifyCheckoutSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
  keySecret: string;
}): boolean {
  const expected = createHmac("sha256", input.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return safeEqualHex(expected, input.signature);
}

/** Razorpay webhooks: HMAC-SHA256 of the raw request body with the webhook secret. */
export function verifyWebhookSignature(input: {
  rawBody: string;
  signature: string;
  webhookSecret: string;
}): boolean {
  const expected = createHmac("sha256", input.webhookSecret).update(input.rawBody).digest("hex");
  return safeEqualHex(expected, input.signature);
}
