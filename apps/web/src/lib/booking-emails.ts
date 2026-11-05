import "server-only";
import { bookings, eq, users } from "@chayan/db";
import { formatMinuteOfDay, formatRupees, istDateKey, istToInstant } from "@chayan/shared";
import { siteConfig } from "@/config/site";
import { getDb } from "@/lib/db";
import { actionEmail, sendEmail } from "@/lib/email";

const dayFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "Asia/Kolkata",
});

export function formatSessionTime(startsAt: Date) {
  const minute = Math.round(
    (startsAt.getTime() - istToInstant(istDateKey(startsAt), 0).getTime()) / 60_000,
  );
  return `${dayFormat.format(startsAt)}, ${formatMinuteOfDay(minute)} IST`;
}

function googleCalendarLink(title: string, start: Date, end: Date, details: string) {
  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${stamp(start)}/${stamp(end)}`,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

async function loadBooking(bookingId: string) {
  const db = getDb();
  const booking = await db.query.bookings.findFirst({ where: eq(bookings.id, bookingId) });
  if (!booking) return null;
  const [aspirant, mentor] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, booking.aspirantUserId),
      columns: { name: true, email: true },
    }),
    db.query.users.findFirst({
      where: eq(users.id, booking.mentorUserId),
      columns: { name: true, email: true },
    }),
  ]);
  if (!aspirant || !mentor) return null;
  return { booking, aspirant, mentor };
}

const firstName = (name: string) => name.split(" ")[0] || name;
const bookingUrl = (id: string) => `${siteConfig.url}/bookings/${id}`;

async function safely(task: () => Promise<void>, label: string) {
  try {
    await task();
  } catch (error) {
    console.error(`Email failed: ${label}`, error);
  }
}

export async function notifyBookingConfirmed(bookingId: string) {
  const data = await loadBooking(bookingId);
  if (!data) return;
  const { booking, aspirant, mentor } = data;
  const when = formatSessionTime(booking.startsAt);
  const calendar = googleCalendarLink(
    `${siteConfig.name}: ${booking.durationMinutes}-min session`,
    booking.startsAt,
    booking.endsAt,
    `Join from ${bookingUrl(booking.id)}`,
  );

  await safely(
    () =>
      sendEmail({
        to: aspirant.email,
        subject: `Booked: ${booking.durationMinutes} min with ${mentor.name}, ${when}`,
        ...actionEmail({
          brand: siteConfig.name,
          greetingName: firstName(aspirant.name),
          intro: `Your ${booking.durationMinutes}-minute session with ${mentor.name} is confirmed for ${when}. You paid ${formatRupees(booking.pricePaise)}. The join button appears on the booking page 10 minutes before the start. Add it to your calendar: ${calendar}`,
          actionLabel: "View your booking",
          actionUrl: bookingUrl(booking.id),
          footer: "You can cancel for a full refund up to 12 hours before the session.",
        }),
      }),
    "booking confirmed (aspirant)",
  );

  await safely(
    () =>
      sendEmail({
        to: mentor.email,
        subject: `New booking: ${aspirant.name}, ${when}`,
        ...actionEmail({
          brand: siteConfig.name,
          greetingName: firstName(mentor.name),
          intro: `${aspirant.name} booked a ${booking.durationMinutes}-minute session with you for ${when}.${booking.aspirantNote ? ` Their note: "${booking.aspirantNote}"` : ""} You'll earn ${formatRupees(booking.mentorEarningsPaise)}. Add it to your calendar: ${calendar}`,
          actionLabel: "View the booking",
          actionUrl: bookingUrl(booking.id),
          footer:
            "If you can't make it, cancel from the booking page so the aspirant is refunded at once.",
        }),
      }),
    "booking confirmed (mentor)",
  );
}

export async function notifyBookingCancelled(
  bookingId: string,
  actor: "aspirant" | "mentor" | "admin" | "system",
  refundPaise: number,
) {
  const data = await loadBooking(bookingId);
  if (!data) return;
  const { booking, aspirant, mentor } = data;
  const when = formatSessionTime(booking.startsAt);
  const refundLine =
    refundPaise > 0
      ? `A refund of ${formatRupees(refundPaise)} is on its way to your original payment method. Banks usually take 5 to 7 working days.`
      : "No refund applies under our cancellation policy.";

  const aspirantIntro =
    actor === "aspirant"
      ? `You cancelled your session with ${mentor.name} on ${when}. ${refundLine}`
      : actor === "system"
        ? `Your payment arrived after the slot with ${mentor.name} on ${when} was taken by someone else, so we couldn't confirm it. ${refundLine}`
        : `${mentor.name} can't make your session on ${when} and it has been cancelled. ${refundLine}`;

  await safely(
    () =>
      sendEmail({
        to: aspirant.email,
        subject: `Cancelled: session on ${when}`,
        ...actionEmail({
          brand: siteConfig.name,
          greetingName: firstName(aspirant.name),
          intro: aspirantIntro,
          actionLabel: "Find another time",
          actionUrl: `${siteConfig.url}/mentors`,
          footer: "Questions about a refund? Reply from the contact page.",
        }),
      }),
    "booking cancelled (aspirant)",
  );

  if (actor !== "mentor") {
    await safely(
      () =>
        sendEmail({
          to: mentor.email,
          subject: `Cancelled: ${aspirant.name}, ${when}`,
          ...actionEmail({
            brand: siteConfig.name,
            greetingName: firstName(mentor.name),
            intro: `The session with ${aspirant.name} on ${when} was cancelled. That time is open for bookings again.`,
            actionLabel: "Open your dashboard",
            actionUrl: `${siteConfig.url}/mentor`,
            footer: "No action is needed.",
          }),
        }),
      "booking cancelled (mentor)",
    );
  }
}

export async function notifyBookingRescheduled(bookingId: string, previousStart: Date) {
  const data = await loadBooking(bookingId);
  if (!data) return;
  const { booking, aspirant, mentor } = data;
  const from = formatSessionTime(previousStart);
  const to = formatSessionTime(booking.startsAt);
  for (const person of [aspirant, mentor]) {
    await safely(
      () =>
        sendEmail({
          to: person.email,
          subject: `Moved to ${to}`,
          ...actionEmail({
            brand: siteConfig.name,
            greetingName: firstName(person.name),
            intro: `The session between ${aspirant.name} and ${mentor.name} moved from ${from} to ${to}.`,
            actionLabel: "View the booking",
            actionUrl: bookingUrl(booking.id),
            footer: "Each booking can be moved once.",
          }),
        }),
      "booking rescheduled",
    );
  }
}
