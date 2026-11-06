import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CallExperience } from "@/components/call/call-experience";
import { FormMessage } from "@/components/ui/field";
import { formatSessionTime } from "@/lib/booking-emails";
import { getBookingDetail } from "@/lib/booking-queries";
import { isJoinOpen, joinWindow } from "@/lib/sessions";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Session", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function CallPage({ params }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await requireUser(`/bookings/${id}/call`);
  const booking = await getBookingDetail(id);
  if (!booking) notFound();
  const role =
    booking.mentorUserId === user.id
      ? "mentor"
      : booking.aspirantUserId === user.id
        ? "aspirant"
        : null;
  if (!role) notFound();

  const { opensAt, closesAt } = joinWindow(booking);
  const open = isJoinOpen(booking);
  const otherName = role === "mentor" ? booking.aspirant.name : booking.mentor.user.name;

  if (!open) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <h1 className="text-3xl font-extrabold">Session with {otherName}</h1>
        <p className="text-ink-muted mt-2">{formatSessionTime(booking.startsAt)}</p>
        <div className="mt-6">
          <FormMessage tone="info">
            {booking.status !== "confirmed"
              ? "This session isn't active, so the call can't be joined."
              : opensAt.getTime() > new Date().getTime()
                ? `The call opens at ${formatSessionTime(opensAt).split(", ").slice(-1)[0]}, 10 minutes before the start.`
                : "This session has ended."}
          </FormMessage>
        </div>
        <Link href={`/bookings/${id}`} className="text-pen mt-6 inline-block font-semibold">
          Back to the booking
        </Link>
      </div>
    );
  }

  return (
    <CallExperience
      bookingId={booking.id}
      role={role}
      otherName={otherName}
      startsAt={booking.startsAt.toISOString()}
      endsAt={booking.endsAt.toISOString()}
      closesAt={closesAt.toISOString()}
      note={booking.aspirantNote}
    />
  );
}
