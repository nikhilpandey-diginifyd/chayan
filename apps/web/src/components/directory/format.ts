import { istDateKey, istToInstant, formatMinuteOfDay } from "@chayan/shared";

const dayFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

export function minuteOfIstDay(instant: Date): number {
  return Math.round((instant.getTime() - istToInstant(istDateKey(instant), 0).getTime()) / 60_000);
}

/** "Today, 6:30 PM", "Tomorrow, 9:00 AM" or "Sat 8 Nov, 7:00 PM" (IST). */
export function formatSlotShort(instant: Date, now = new Date()): string {
  const key = istDateKey(instant);
  const today = istDateKey(now);
  const tomorrow = istDateKey(new Date(now.getTime() + 24 * 60 * 60_000));
  const time = formatMinuteOfDay(minuteOfIstDay(instant));
  if (key === today) return `Today, ${time}`;
  if (key === tomorrow) return `Tomorrow, ${time}`;
  return `${dayFormat.format(instant)}, ${time}`;
}

export function formatIstDay(dateKey: string): string {
  return dayFormat.format(istToInstant(dateKey, 12 * 60));
}
