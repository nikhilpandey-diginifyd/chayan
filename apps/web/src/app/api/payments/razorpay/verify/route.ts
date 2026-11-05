import { z } from "zod";
import { and, bookings, eq, payments } from "@chayan/db";
import { getServerEnv } from "@/env";
import { getAuth } from "@/lib/auth";
import { confirmPayment } from "@/lib/bookings";
import { getDb } from "@/lib/db";
import { verifyCheckoutSignature } from "@/lib/payments/signatures";

export const runtime = "nodejs";

const bodySchema = z.object({
  orderId: z.string().min(5).max(100),
  paymentId: z.string().min(5).max(100),
  signature: z.string().min(10).max(200),
});

/** Called by the browser after Razorpay Checkout succeeds. */
export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Sign in again." }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request." }, { status: 400 });

  const secret = getServerEnv().RAZORPAY_KEY_SECRET;
  if (!secret) return Response.json({ error: "Payments are not configured." }, { status: 503 });

  const valid = verifyCheckoutSignature({
    orderId: parsed.data.orderId,
    paymentId: parsed.data.paymentId,
    signature: parsed.data.signature,
    keySecret: secret,
  });
  if (!valid) return Response.json({ error: "Payment could not be verified." }, { status: 400 });

  // The order must belong to a booking made by this user.
  const [owned] = await getDb()
    .select({ bookingId: payments.bookingId })
    .from(payments)
    .innerJoin(bookings, eq(bookings.id, payments.bookingId))
    .where(
      and(
        eq(payments.provider, "razorpay"),
        eq(payments.providerOrderId, parsed.data.orderId),
        eq(bookings.aspirantUserId, session.user.id),
      ),
    )
    .limit(1);
  if (!owned) return Response.json({ error: "Booking not found." }, { status: 404 });

  const result = await confirmPayment({
    provider: "razorpay",
    orderId: parsed.data.orderId,
    paymentId: parsed.data.paymentId,
  });
  return Response.json(result);
}
