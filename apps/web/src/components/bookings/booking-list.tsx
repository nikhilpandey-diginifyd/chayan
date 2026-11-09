import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatRupees } from "@chayan/shared";
import { formatSessionTime } from "@/lib/booking-emails";
import type { BookingListItem } from "@/lib/booking-queries";
import { BookingStatusBadge } from "./status-badge";

const monthFormat = new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "Asia/Kolkata" });
const dayFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", timeZone: "Asia/Kolkata" });

export function BookingList({
  items,
  perspective,
  empty,
}: {
  items: BookingListItem[];
  perspective: "aspirant" | "mentor";
  empty: string;
}) {
  if (items.length === 0)
    return (
      <p className="text-ink-muted border-line rounded-[var(--radius-card)] border border-dashed bg-white/60 px-4 py-6 text-center">
        {empty}
      </p>
    );
  return (
    <ul className="divide-line -mx-2 divide-y">
      {items.map((item) => (
        <li
          key={item.id}
          className="group hover:bg-pen-soft/40 relative flex items-center gap-4 rounded-[var(--radius-control)] px-2 py-3.5 transition-colors"
        >
          <span
            aria-hidden="true"
            className="border-line grid w-12 shrink-0 overflow-hidden rounded-lg border bg-white text-center leading-none"
          >
            <span className="bg-omr py-0.5 text-[0.65rem] font-semibold text-white">
              {monthFormat.format(item.startsAt)}
            </span>
            <span className="font-display py-1.5 text-lg font-extrabold">
              {dayFormat.format(item.startsAt)}
            </span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">
              <Link href={`/bookings/${item.id}`} className="after:absolute after:inset-0">
                {formatSessionTime(item.startsAt)}
              </Link>
            </p>
            <p className="text-ink-muted text-sm">
              {item.durationMinutes} min with{" "}
              {perspective === "aspirant" ? item.mentorName : item.aspirantName}
              {perspective === "mentor"
                ? ` · you earn ${formatRupees(item.mentorEarningsPaise)}`
                : ""}
            </p>
          </div>
          <BookingStatusBadge status={item.status} />
          <ChevronRight
            aria-hidden="true"
            className="text-ink-muted size-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </li>
      ))}
    </ul>
  );
}
