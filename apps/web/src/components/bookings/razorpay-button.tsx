"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatRupees } from "@chayan/shared";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = {
  open(): void;
  on(
    event: "payment.failed",
    handler: (response: { error?: { description?: string } }) => void,
  ): void;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadCheckout(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(true));
    script.addEventListener("error", () => resolve(false));
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

export function RazorpayButton({
  bookingId,
  keyId,
  orderId,
  amountPaise,
  description,
  prefill,
}: {
  bookingId: string;
  keyId: string;
  orderId: string;
  amountPaise: number;
  description: string;
  prefill: { name: string; email: string };
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "opening" | "verifying">("idle");
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    setState("opening");
    if (!(await loadCheckout()) || !window.Razorpay) {
      setError("Couldn't load the payment window. Check your connection and try again.");
      setState("idle");
      return;
    }

    const checkout = new window.Razorpay({
      key: keyId,
      order_id: orderId,
      amount: amountPaise,
      currency: "INR",
      name: siteConfig.name,
      description,
      prefill,
      theme: { color: "#ef6311" },
      handler: async (response: RazorpaySuccess) => {
        setState("verifying");
        const result = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          }),
        }).catch(() => null);
        // Even if this request fails, the Razorpay webhook confirms the booking.
        router.push(`/bookings/${bookingId}?paid=1`);
        router.refresh();
        if (!result?.ok) console.warn("Verification request failed; waiting for webhook");
      },
      modal: {
        ondismiss: () => setState("idle"),
      },
    });
    checkout.on("payment.failed", (response) => {
      setError(
        response.error?.description ?? "The payment failed. You weren't charged. Try again.",
      );
      setState("idle");
    });
    checkout.open();
  }

  return (
    <div className="space-y-3">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Button type="button" size="lg" className="w-full" onClick={pay} disabled={state !== "idle"}>
        {state === "verifying"
          ? "Confirming your booking…"
          : state === "opening"
            ? "Opening payment…"
            : `Pay ${formatRupees(amountPaise)}`}
      </Button>
    </div>
  );
}
