import type { Metadata } from "next";
import { BookingList } from "@/components/bookings/booking-list";
import { listBookingsFor } from "@/lib/booking-queries";
import { requireMentor } from "@/lib/mentor-profile";

export const metadata: Metadata = { title: "Bookings", robots: { index: false } };

export default async function MentorBookingsPage() {
  const { user } = await requireMentor("/mentor/bookings");
  const [upcoming, past] = await Promise.all([
    listBookingsFor({ role: "mentor", userId: user.id, when: "upcoming" }),
    listBookingsFor({ role: "mentor", userId: user.id, when: "past", limit: 50 }),
  ]);
  return (
    <div className="max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold">Bookings</h1>
      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Upcoming</h2>
        <div className="mt-2">
          <BookingList
            items={upcoming.filter((item) => item.status === "confirmed")}
            perspective="mentor"
            empty="No upcoming bookings."
          />
        </div>
      </section>
      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Past and cancelled</h2>
        <div className="mt-2">
          <BookingList items={past} perspective="mentor" empty="Nothing here yet." />
        </div>
      </section>
    </div>
  );
}
