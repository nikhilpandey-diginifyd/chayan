import type { Metadata } from "next";
import { BookingList } from "@/components/bookings/booking-list";
import { PageHero } from "@/components/page/page-hero";
import { ButtonLink } from "@/components/ui/button";
import { listBookingsFor } from "@/lib/booking-queries";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "My sessions", robots: { index: false } };

export default async function MyBookingsPage() {
  const user = await requireUser("/bookings");
  const [upcoming, past] = await Promise.all([
    listBookingsFor({ role: "aspirant", userId: user.id, when: "upcoming" }),
    listBookingsFor({ role: "aspirant", userId: user.id, when: "past", limit: 30 }),
  ]);

  return (
    <>
      <PageHero
        eyebrow={`${upcoming.length} upcoming · ${past.length} past`}
        title="My sessions"
        lines={["Har session, ek naya plan.", "Notes aur next steps yahin milenge."]}
      >
        <ButtonLink href="/mentors" variant="secondary" size="sm">
          Book a new session
        </ButtonLink>
      </PageHero>
      <div className="relative mx-auto -mt-8 max-w-3xl px-4 pb-16 sm:px-6">
        <section className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-6 shadow-[var(--shadow-raised)]">
          <h2 className="text-xl font-bold">Upcoming</h2>
          <div className="mt-2">
            <BookingList items={upcoming} perspective="aspirant" empty="No upcoming sessions." />
          </div>
        </section>
        <section className="border-line bg-surface panel mt-8 rounded-[var(--radius-panel)] border p-6">
          <h2 className="text-xl font-bold">Past and cancelled</h2>
          <div className="mt-2">
            <BookingList items={past} perspective="aspirant" empty="Nothing here yet." />
          </div>
        </section>
      </div>
    </>
  );
}
