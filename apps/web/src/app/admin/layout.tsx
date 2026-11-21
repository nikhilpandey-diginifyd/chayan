import type { ReactNode } from "react";
import { and, bookings, count, eq, gte, lt, mentorApplications, payouts } from "@chayan/db";
import { istToInstant } from "@chayan/shared";
import { AdminBanner } from "@/components/admin/admin-banner";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";

function todayIst() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(["admin"], "/admin");
  const db = getDb();
  const day = todayIst();
  const [[applications], [toPay], [today]] = await Promise.all([
    db
      .select({ total: count() })
      .from(mentorApplications)
      .where(eq(mentorApplications.status, "submitted")),
    db.select({ total: count() }).from(payouts).where(eq(payouts.status, "pending")),
    db
      .select({ total: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "confirmed"),
          gte(bookings.startsAt, istToInstant(day, 0)),
          lt(bookings.startsAt, istToInstant(day, 24 * 60)),
        ),
      ),
  ]);
  return (
    <>
      <AdminBanner
        pendingApplications={applications?.total ?? 0}
        pendingPayouts={toPay?.total ?? 0}
        sessionsToday={today?.total ?? 0}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </>
  );
}
