import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyCheckoutSignature, verifyWebhookSignature } from "./signatures";

const secret = "test_secret_123";

describe("Razorpay signatures", () => {
  it("accepts a valid checkout signature and rejects tampering", () => {
    const signature = createHmac("sha256", secret).update("order_1|pay_1").digest("hex");
    expect(
      verifyCheckoutSignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature,
        keySecret: secret,
      }),
    ).toBe(true);
    expect(
      verifyCheckoutSignature({
        orderId: "order_1",
        paymentId: "pay_2",
        signature,
        keySecret: secret,
      }),
    ).toBe(false);
    expect(
      verifyCheckoutSignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "zz",
        keySecret: secret,
      }),
    ).toBe(false);
  });
  it("verifies webhook bodies byte for byte", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature({ rawBody: body, signature, webhookSecret: secret })).toBe(true);
    expect(verifyWebhookSignature({ rawBody: body + " ", signature, webhookSecret: secret })).toBe(
      false,
    );
  });
});
