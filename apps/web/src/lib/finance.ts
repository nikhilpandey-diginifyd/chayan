import "server-only";
import { bookings, payments, payoutItems, payouts, refunds, sql } from "@chayan/db";
import { bookingEarnings } from "@chayan/shared";
import { getDb } from "@/lib/db";

/** Money totals for the admin. Platform fees and amounts owed count finished sessions only. */
export async function getFinanceSummary() {
  const db = getDb();
  const [money] = await db
    .select({
      collected: sql<number>`coalesce((select sum(amount_paise) from ${payments} where captured_at is not null), 0)::int`,
      refunded: sql<number>`coalesce((select sum(amount_paise) from ${refunds} where status <> 'failed'), 0)::int`,
      paidOut: sql<number>`coalesce((select sum(net_paise + tds_paise) from ${payouts} where status = 'paid'), 0)::int`,
      inPayouts: sql<number>`coalesce((select sum(mentor_share_paise) from ${payouts} where status <> 'paid'), 0)::int`,
    })
    .from(sql`(select 1) as one`);

  const finished = await db
    .select({
      id: bookings.id,
      price: bookings.pricePaise,
      refunded: sql<number>`coalesce((select sum(r.amount_paise) from ${refunds} r join ${payments} p on p.id = r.payment_id where p.booking_id = "bookings"."id" and r.status <> 'failed'), 0)::int`,
      inPayout: sql<boolean>`exists (select 1 from ${payoutItems} i where i.booking_id = "bookings"."id")`,
    })
    .from(bookings)
    .where(
      sql`${bookings.status} in ('completed', 'no_show_aspirant', 'cancelled_by_aspirant') and exists (select 1 from ${payments} p where p.booking_id = "bookings"."id" and p.captured_at is not null)`,
    );

  let platformFee = 0;
  let owedNotInPayout = 0;
  for (const row of finished) {
    const earnings = bookingEarnings(row.price, row.refunded);
    platformFee += earnings.platformFeePaise;
    if (!row.inPayout) owedNotInPayout += earnings.mentorSharePaise;
  }

  return {
    collectedPaise: money?.collected ?? 0,
    refundedPaise: money?.refunded ?? 0,
    platformFeePaise: platformFee,
    paidOutPaise: money?.paidOut ?? 0,
    owedPaise: (money?.inPayouts ?? 0) + owedNotInPayout,
  };
}
