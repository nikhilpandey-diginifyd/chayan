import { ShieldCheck, Smartphone } from "lucide-react";
import { PageHero } from "@/components/page/page-hero";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { formatRupees } from "@chayan/shared";
import { HoldCountdown } from "@/components/bookings/hold-countdown";
import { RazorpayButton } from "@/components/bookings/razorpay-button";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { formatSessionTime } from "@/lib/booking-emails";
import { getBookingDetail } from "@/lib/booking-queries";
import { getPaymentProvider } from "@/lib/payments/provider";
import { requireUser } from "@/lib/session";
import { payWithTestMode } from "./actions";

export const metadata: Metadata = { title: "Pay for your session", robots: { index: false } };

function currentTime() {
  return Date.now();
}

type Props = { params: Promise<{ id: string }> };

export default async function PayPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser(`/bookings/${id}/pay`);
  const booking = await getBookingDetail(id);
  if (!booking || booking.aspirantUserId !== user.id) notFound();

  if (booking.status === "confirmed") redirect(`/bookings/${id}`);

  const holdActive =
    booking.status === "pending_payment" &&
    booking.holdExpiresAt !== null &&
    booking.holdExpiresAt.getTime() > currentTime();
  const payment = booking.payments.find(
    (row) => row.status === "created" || row.status === "failed",
  );
  const provider = getPaymentProvider();

  return (
    <>
      <PageHero
        eyebrow="Secure payment"
        title="Pay for your session"
        lines={["Bas ek step aur!", "Aapka mentor wait kar raha hai."]}
      />
      <div className="relative mx-auto -mt-10 max-w-lg px-4 pb-16">
        <div className="panel border-line relative overflow-hidden rounded-[var(--radius-panel)] border bg-white shadow-[var(--shadow-raised)]">
          <div aria-hidden="true" className="from-saffron to-pen h-1.5 bg-gradient-to-r" />
          <div className="p-6">
            <p className="text-pen text-sm font-bold">Your session ticket</p>
            <dl className="space-y-3">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Mentor</dt>
                <dd className="text-right font-semibold">{booking.mentor.user.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">When</dt>
                <dd className="text-right font-semibold">{formatSessionTime(booking.startsAt)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-muted">Length</dt>
                <dd className="text-right font-semibold">{booking.durationMinutes} minutes</dd>
              </div>
              <div className="border-line flex justify-between gap-4 border-t pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="text-right text-xl font-bold">{formatRupees(booking.pricePaise)}</dd>
              </div>
            </dl>
          </div>
          <div aria-hidden="true" className="relative flex items-center">
            <span className="bg-paper -ml-3 size-6 rounded-full" />
            <span className="border-line flex-1 border-t-2 border-dashed" />
            <span className="bg-paper -mr-3 size-6 rounded-full" />
          </div>
          <ul className="text-ink-muted flex flex-wrap justify-center gap-x-5 gap-y-1 px-6 py-4 text-sm">
            <li className="flex items-center gap-1.5">
              <ShieldCheck aria-hidden="true" className="text-seal size-4" />
              Secured by Razorpay
            </li>
            <li className="flex items-center gap-1.5">
              <Smartphone aria-hidden="true" className="text-pen size-4" />
              UPI, cards, net banking
            </li>
          </ul>
        </div>

        <div className="mt-6 space-y-4">
          {!holdActive || !payment ? (
            <>
              <FormMessage tone="error">
                Your 10-minute hold on this slot has ended, so it may have gone to someone else.
              </FormMessage>
              <Link href={`/mentors/${booking.mentor.slug}`} className="text-pen font-semibold">
                Choose another time
              </Link>
            </>
          ) : (
            <>
              <HoldCountdown expiresAt={booking.holdExpiresAt!.toISOString()} />
              {payment.status === "failed" ? (
                <FormMessage tone="error">
                  Your last payment attempt didn&apos;t go through. You weren&apos;t charged. Try
                  again.
                </FormMessage>
              ) : null}
              {provider.name === "razorpay" ? (
                <RazorpayButton
                  bookingId={booking.id}
                  keyId={provider.publicKey!}
                  orderId={payment.providerOrderId}
                  amountPaise={booking.pricePaise}
                  description={`${booking.durationMinutes}-min session with ${booking.mentor.user.name}`}
                  prefill={{ name: user.name, email: user.email }}
                />
              ) : (
                <form action={payWithTestMode} className="space-y-2">
                  <input type="hidden" name="bookingId" value={booking.id} />
                  <Button type="submit" size="lg" className="w-full">
                    Pay {formatRupees(booking.pricePaise)} (test mode)
                  </Button>
                  <p className="text-ink-muted text-center text-sm">
                    Razorpay keys aren&apos;t set, so this simulates a successful payment. No money
                    moves.
                  </p>
                </form>
              )}
              <p className="text-ink-muted text-center text-sm">
                UPI, cards and net banking through Razorpay. Full refund if you cancel 12 hours or
                more before the session.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
