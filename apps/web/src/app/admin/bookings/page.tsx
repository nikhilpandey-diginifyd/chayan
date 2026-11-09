import type { Metadata } from "next";
import Link from "next/link";
import { aliasedTable, bookings, desc, eq, payments, users } from "@chayan/db";
import { formatRupees } from "@chayan/shared";
import { BookingStatusBadge } from "@/components/bookings/status-badge";
import { formatSessionTime } from "@/lib/booking-emails";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Bookings", robots: { index: false } };

const mentorUser = aliasedTable(users, "mentor_user");
const aspirantUser = aliasedTable(users, "aspirant_user");

export default async function AdminBookingsPage() {
  await requireRole(["admin"], "/admin/bookings");
  const rows = await getDb()
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      status: bookings.status,
      pricePaise: bookings.pricePaise,
      mentor: mentorUser.name,
      aspirant: aspirantUser.name,
      paymentStatus: payments.status,
      provider: payments.provider,
    })
    .from(bookings)
    .innerJoin(mentorUser, eq(mentorUser.id, bookings.mentorUserId))
    .innerJoin(aspirantUser, eq(aspirantUser.id, bookings.aspirantUserId))
    .leftJoin(payments, eq(payments.bookingId, bookings.id))
    .orderBy(desc(bookings.createdAt))
    .limit(100);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Bookings</h1>
      <p className="text-ink-muted mt-2">The latest 100 bookings, newest first.</p>
      {rows.length === 0 ? (
        <p className="text-ink-muted mt-8">No bookings yet.</p>
      ) : (
        <div className="border-line bg-surface mt-6 overflow-x-auto rounded-[var(--radius-control)] border">
          <table className="data-table w-full min-w-[820px] text-left text-sm">
            <thead className="border-line text-ink-muted border-b">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Session
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Mentor
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Aspirant
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Price
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Payment
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <Link href={`/bookings/${row.id}`} className="text-pen font-semibold">
                      {formatSessionTime(row.startsAt)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{row.mentor}</td>
                  <td className="px-4 py-3">{row.aspirant}</td>
                  <td className="px-4 py-3">{formatRupees(row.pricePaise)}</td>
                  <td className="px-4 py-3 capitalize">
                    {row.paymentStatus ? row.paymentStatus.replace("_", " ") : "—"}
                    {row.provider === "mock" ? " (test)" : ""}
                  </td>
                  <td className="px-4 py-3">
                    <BookingStatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
