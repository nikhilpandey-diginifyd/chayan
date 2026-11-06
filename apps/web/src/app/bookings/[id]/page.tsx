import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  canReschedule,
  formatRupees,
  generateSlots,
  REVIEW_TAG_LABELS,
  type ReviewTag,
} from "@chayan/shared";
import { CancelBookingForm, RescheduleForm } from "@/components/bookings/booking-actions";
import { NotesSection } from "@/components/bookings/notes-form";
import { ReviewSection } from "@/components/bookings/review-form";
import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { ButtonLink } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { formatSessionTime } from "@/lib/booking-emails";
import { getBookingDetail } from "@/lib/booking-queries";
import { getBusyIntervals, refundForCancellation } from "@/lib/bookings";
import { getMentorWorkspace } from "@/lib/mentor-profile";
import { reviewWindowOpen } from "@/lib/reviews";
import { isJoinOpen, joinWindow } from "@/lib/sessions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Booking", robots: { index: false } };

function currentTime() {
  return Date.now();
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const refundStatusText: Record<string, string> = {
  pending: "on its way",
  processed: "processed",
  failed: "failed, our team will retry",
};

export default async function BookingPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser(`/bookings/${id}`);
  const booking = await getBookingDetail(id);
  if (!booking) notFound();

  const perspective =
    booking.aspirantUserId === user.id
      ? "aspirant"
      : booking.mentorUserId === user.id
        ? "mentor"
        : user.role === "admin"
          ? "admin"
          : null;
  if (!perspective) notFound();

  const isUpcoming = booking.startsAt.getTime() > currentTime();
  const isConfirmed = booking.status === "confirmed";
  const payment = booking.payments[0];
  const refundsList = booking.payments.flatMap((row) => row.refunds);

  let rescheduleSlots: string[] = [];
  const reschedulable =
    perspective === "aspirant" &&
    isConfirmed &&
    canReschedule(booking.startsAt, booking.rescheduleCount);
  if (reschedulable) {
    const mentor = await getMentorWorkspace(booking.mentorUserId);
    if (mentor && mentor.status === "active") {
      const busy =
        (await getBusyIntervals([mentor.userId], undefined, { excludeBookingId: booking.id })).get(
          mentor.userId,
        ) ?? [];
      rescheduleSlots = generateSlots({
        rules: mentor.availabilityRules,
        blockedDates: mentor.blockedDates.map((row) => row.date),
        busy,
        durationMinutes: booking.durationMinutes,
        bufferMinutes: mentor.bufferMinutes,
        minNoticeHours: Math.max(mentor.minNoticeHours, 12),
        bookingWindowDays: mentor.bookingWindowDays,
      })
        .filter((slot) => slot.getTime() !== booking.startsAt.getTime())
        .map((slot) => slot.toISOString());
    }
  }

  const otherPerson = perspective === "mentor" ? booking.aspirant.name : booking.mentor.user.name;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href={
          perspective === "mentor"
            ? "/mentor/bookings"
            : perspective === "admin"
              ? "/admin/bookings"
              : "/bookings"
        }
        className="text-pen text-sm font-semibold"
      >
        {perspective === "mentor"
          ? "All bookings"
          : perspective === "admin"
            ? "All bookings"
            : "My sessions"}
      </Link>

      {query.paid && isConfirmed ? (
        <div className="mt-6">
          <FormMessage tone="success">
            Payment received. Your session is booked and we&apos;ve emailed you the details.
          </FormMessage>
        </div>
      ) : null}
      {query.paid && booking.status === "pending_payment" ? (
        <div className="mt-6">
          <FormMessage tone="info">
            We&apos;re confirming your payment with the bank. This usually takes a few seconds.
            Refresh the page in a moment.
          </FormMessage>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-extrabold">{formatSessionTime(booking.startsAt)}</h1>
        <BookingStatusBadge status={booking.status} />
      </div>
      <p className="text-ink-muted mt-2">
        {booking.durationMinutes}-minute session with {otherPerson}
        {perspective === "admin" ? ` and ${booking.aspirant.name}` : ""}
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-[1.4fr_1fr]">
        <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6">
          <h2 className="text-xl font-bold">Session</h2>
          {isJoinOpen(booking) ? (
            <div className="mt-3 space-y-2">
              <ButtonLink href={`/bookings/${booking.id}/call`} size="lg">
                Join the call
              </ButtonLink>
              <p className="text-ink-muted text-sm">
                Join within 10 minutes of the start. After that the session counts as missed.
              </p>
            </div>
          ) : isConfirmed && joinWindow(booking).opensAt.getTime() > currentTime() ? (
            <p className="border-line bg-paper mt-3 rounded-[var(--radius-control)] border px-4 py-3 text-sm">
              The join button appears here 10 minutes before the start. Join within 10 minutes of
              the start, or the session counts as missed.
            </p>
          ) : null}
          {booking.aspirantNote ? (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">
                {perspective === "aspirant"
                  ? "Your note to the mentor"
                  : "What the aspirant wants help with"}
              </h3>
              <p className="text-ink-muted mt-1 whitespace-pre-line">{booking.aspirantNote}</p>
            </div>
          ) : null}
          {booking.cancelReason && booking.status !== "confirmed" ? (
            <p className="text-ink-muted mt-4 text-sm">Reason: {booking.cancelReason}</p>
          ) : null}

          {isConfirmed && isUpcoming ? (
            <div className="mt-6 space-y-3">
              {reschedulable ? (
                <RescheduleForm bookingId={booking.id} slots={rescheduleSlots} />
              ) : null}
              <CancelBookingForm
                bookingId={booking.id}
                actor={perspective}
                pricePaise={booking.pricePaise}
                refundPaise={refundForCancellation(perspective, booking)}
              />
            </div>
          ) : null}
          {booking.status === "pending_payment" && perspective === "aspirant" ? (
            <div className="mt-6">
              <ButtonLink href={`/bookings/${booking.id}/pay`}>Complete payment</ButtonLink>
            </div>
          ) : null}
          {perspective === "aspirant" && booking.mentor.slug ? (
            <p className="mt-6 text-sm">
              <Link href={`/mentors/${booking.mentor.slug}`} className="text-pen font-semibold">
                View {booking.mentor.user.name}&apos;s profile
              </Link>
            </p>
          ) : null}
        </section>

        <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6">
          <h2 className="text-xl font-bold">Payment</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">
                {perspective === "mentor" ? "Session price" : "Paid"}
              </dt>
              <dd className="font-semibold">{formatRupees(booking.pricePaise)}</dd>
            </div>
            {perspective !== "aspirant" ? (
              <>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Platform fee</dt>
                  <dd>{formatRupees(booking.platformFeePaise)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Mentor earns</dt>
                  <dd className="font-semibold">{formatRupees(booking.mentorEarningsPaise)}</dd>
                </div>
              </>
            ) : null}
            {payment ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Status</dt>
                <dd className="capitalize">{payment.status.replace("_", " ")}</dd>
              </div>
            ) : null}
          </dl>
          {refundsList.length > 0 ? (
            <ul className="border-line mt-4 space-y-1 border-t pt-3 text-sm">
              {refundsList.map((refund) => (
                <li key={refund.id}>
                  Refund of {formatRupees(refund.amountPaise)}: {refundStatusText[refund.status]}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-ink-muted mt-4 text-xs">Booking ID {booking.id.slice(0, 8)}</p>
        </section>
      </div>

      {(perspective === "mentor" || perspective === "admin") &&
      ["confirmed", "completed"].includes(booking.status) &&
      booking.startsAt.getTime() <= currentTime() ? (
        <section
          id="notes"
          className="border-line bg-surface mt-6 scroll-mt-6 rounded-[var(--radius-panel)] border p-6"
        >
          <h2 className="text-xl font-bold">Notes for {booking.aspirant.name}</h2>
          <p className="text-ink-muted mt-1 text-sm">
            The aspirant sees these on this page. Clear next steps make the session stick.
          </p>
          <div className="mt-4">
            <NotesSection
              bookingId={booking.id}
              initial={{
                sessionSummary: booking.sessionSummary ?? "",
                nextSteps: booking.nextSteps ?? "",
              }}
            />
          </div>
        </section>
      ) : null}

      {perspective === "aspirant" && booking.status === "completed" ? (
        <section
          id="notes"
          className="border-line bg-surface mt-6 scroll-mt-6 rounded-[var(--radius-panel)] border p-6"
        >
          <h2 className="text-xl font-bold">Notes from {booking.mentor.user.name}</h2>
          {booking.sessionSummary || booking.nextSteps ? (
            <div className="mt-3 space-y-4">
              {booking.sessionSummary ? (
                <div>
                  <h3 className="text-sm font-semibold">What you discussed</h3>
                  <p className="text-ink-muted mt-1 whitespace-pre-line">
                    {booking.sessionSummary}
                  </p>
                </div>
              ) : null}
              {booking.nextSteps ? (
                <div>
                  <h3 className="text-sm font-semibold">Your next steps</h3>
                  <p className="mt-1 whitespace-pre-line">{booking.nextSteps}</p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-ink-muted mt-2">
              Your mentor hasn&apos;t added notes yet. We&apos;ll keep them here.
            </p>
          )}
        </section>
      ) : null}

      {perspective === "aspirant" && booking.status === "completed" ? (
        <section
          id="review"
          className="border-line bg-surface mt-6 scroll-mt-6 rounded-[var(--radius-panel)] border p-6"
        >
          <h2 className="text-xl font-bold">Your review</h2>
          {reviewWindowOpen(booking.endsAt) ? (
            <div className="mt-4">
              <ReviewSection
                bookingId={booking.id}
                mentorName={booking.mentor.user.name}
                initial={
                  booking.review
                    ? {
                        rating: booking.review.rating,
                        tags: booking.review.tags,
                        comment: booking.review.comment,
                        mentorOnCamera: booking.review.mentorOnCamera,
                      }
                    : undefined
                }
              />
            </div>
          ) : booking.review ? (
            <p className="text-ink-muted mt-2">
              You rated this session {booking.review.rating} out of 5.
              {booking.review.tags.length > 0
                ? ` ${booking.review.tags.map((tag) => REVIEW_TAG_LABELS[tag as ReviewTag] ?? tag).join(", ")}.`
                : ""}
            </p>
          ) : (
            <p className="text-ink-muted mt-2">The review window for this session has closed.</p>
          )}
        </section>
      ) : null}

      {perspective !== "aspirant" && booking.review && !booking.review.isHidden ? (
        <section className="border-line bg-surface mt-6 rounded-[var(--radius-panel)] border p-6">
          <h2 className="text-xl font-bold">Aspirant&apos;s review</h2>
          <p className="mt-2 font-semibold">{booking.review.rating} out of 5</p>
          {booking.review.comment ? (
            <p className="text-ink-muted mt-1 whitespace-pre-line">{booking.review.comment}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
