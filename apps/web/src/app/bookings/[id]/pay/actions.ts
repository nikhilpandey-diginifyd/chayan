"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { and, bookings, eq, payments } from "@chayan/db";
import { getServerEnv } from "@/env";
import { confirmPayment } from "@/lib/bookings";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";

/** Test payments: only when Razorpay keys are not set, and never in production. */
export async function payWithTestMode(formData: FormData): Promise<void> {
  const env = getServerEnv();
  if (env.NODE_ENV === "production" || env.RAZORPAY_KEY_ID) {
    throw new Error("Test payments are disabled");
  }
  const bookingId = String(formData.get("bookingId") ?? "");
  const user = await requireUser(`/bookings/${bookingId}/pay`);

  const [row] = await getDb()
    .select({ orderId: payments.providerOrderId })
    .from(payments)
    .innerJoin(bookings, eq(bookings.id, payments.bookingId))
    .where(
      and(
        eq(payments.bookingId, bookingId),
        eq(payments.provider, "mock"),
        eq(bookings.aspirantUserId, user.id),
      ),
    )
    .limit(1);
  if (!row) redirect(`/bookings/${bookingId}`);

  await confirmPayment({
    provider: "mock",
    orderId: row.orderId,
    paymentId: `mock_pay_${randomUUID()}`,
    method: "test",
  });
  redirect(`/bookings/${bookingId}?paid=1`);
}
