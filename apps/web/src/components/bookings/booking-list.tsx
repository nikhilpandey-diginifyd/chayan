import Link from "next/link";
import { formatRupees } from "@chayan/shared";
import { formatSessionTime } from "@/lib/booking-emails";
import type { BookingListItem } from "@/lib/booking-queries";
import { BookingStatusBadge } from "./status-badge";

export function BookingList({
  items,
  perspective,
  empty,
}: {
  items: BookingListItem[];
  perspective: "aspirant" | "mentor";
  empty: string;
}) {
  if (items.length === 0) return <p className="text-ink-muted">{empty}</p>;
  return (
    <ul className="divide-line divide-y">
      {items.map((item) => (
        <li
          key={item.id}
          className="relative flex flex-wrap items-center justify-between gap-3 py-4"
        >
          <div className="min-w-0">
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
        </li>
      ))}
    </ul>
  );
}
