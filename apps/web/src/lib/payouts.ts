import "server-only";
import {
  aliasedTable,
  and,
  asc,
  bookings,
  desc,
  eq,
  gte,
  inArray,
  isNull,
  lt,
  mentorPayoutAccounts,
  payoutItems,
  payouts,
  refunds,
  payments,
  sql,
  users,
} from "@chayan/db";
import {
  bookingEarnings,
  financialYear,
  istToInstant,
  PAYOUT_POLICY,
  payoutTds,
} from "@chayan/shared";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";

/** Booking statuses that can earn the mentor money. */
const EARNING_STATUSES = ["completed", "no_show_aspirant", "cancelled_by_aspirant"] as const;

/** Refunded amount per booking (pending and processed refunds count; failed ones don't). */
const refundedSql = sql<number>`coalesce((select sum(r.amount_paise) from ${refunds} r join ${payments} p on p.id = r.payment_id where p.booking_id = "bookings"."id" and r.status <> 'failed'), 0)::int`;
const capturedSql = sql<boolean>`exists (select 1 from ${payments} p where p.booking_id = "bookings"."id" and p.captured_at is not null)`;

/** Earnings not yet included in any payout. */
export async function unpaidEarnings(options: { mentorUserId?: string; endedBefore: Date }) {
  const conditions = [
    inArray(bookings.status, [...EARNING_STATUSES]),
    lt(bookings.endsAt, options.endedBefore),
    isNull(payoutItems.id),
    capturedSql,
  ];
  if (options.mentorUserId) conditions.push(eq(bookings.mentorUserId, options.mentorUserId));
  const rows = await getDb()
    .select({
      bookingId: bookings.id,
      mentorUserId: bookings.mentorUserId,
      startsAt: bookings.startsAt,
      status: bookings.status,
      pricePaise: bookings.pricePaise,
      refundedPaise: refundedSql,
    })
    .from(bookings)
    .leftJoin(payoutItems, eq(payoutItems.bookingId, bookings.id))
    .where(and(...conditions))
    .orderBy(asc(bookings.startsAt));
  return rows
    .map((row) => ({ ...row, ...bookingEarnings(row.pricePaise, row.refundedPaise) }))
    .filter((row) => row.grossPaise > 0);
}

/** Monday to Sunday (IST) week that ends on `periodEnd` (a Sunday, YYYY-MM-DD). */
export function weekBounds(periodEnd: string) {
  const endExclusive = istToInstant(periodEnd, 24 * 60);
  const startInstant = new Date(endExclusive.getTime() - 7 * 24 * 60 * 60_000);
  const startDate = new Date(startInstant.getTime() + 330 * 60_000).toISOString().slice(0, 10);
  return { periodStart: startDate, endExclusive };
}

export class PayoutError extends Error {}

/**
 * Creates one payout per mentor for every unpaid earning that ended before the
 * end of the chosen week and at least 48 hours ago. Mentors without payout
 * details are skipped; their earnings roll into a later week.
 */
export async function generatePayouts(periodEnd: string, adminId: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)) throw new PayoutError("Choose the week's end date.");
  const { periodStart, endExclusive } = weekBounds(periodEnd);
  const holdCutoff = new Date(Date.now() - PAYOUT_POLICY.holdHours * 60 * 60_000);
  const endedBefore = endExclusive < holdCutoff ? endExclusive : holdCutoff;

  const earnings = await unpaidEarnings({ endedBefore });
  const byMentor = new Map<string, typeof earnings>();
  for (const row of earnings) {
    byMentor.set(row.mentorUserId, [...(byMentor.get(row.mentorUserId) ?? []), row]);
  }

  const db = getDb();
  const accounts = byMentor.size
    ? await db
        .select()
        .from(mentorPayoutAccounts)
        .where(inArray(mentorPayoutAccounts.mentorUserId, [...byMentor.keys()]))
    : [];
  const fy = financialYear(endExclusive);

  const created: string[] = [];
  const skipped: { mentorUserId: string; amountPaise: number }[] = [];

  for (const [mentorUserId, rows] of byMentor) {
    const account = accounts.find((item) => item.mentorUserId === mentorUserId);
    const mentorShare = rows.reduce((sum, row) => sum + row.mentorSharePaise, 0);
    if (!account) {
      skipped.push({ mentorUserId, amountPaise: mentorShare });
      continue;
    }

    const id = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ id: payouts.id })
        .from(payouts)
        .where(and(eq(payouts.mentorUserId, mentorUserId), eq(payouts.periodEnd, periodEnd)));
      if (existing) return null;

      const [yearBefore] = await tx
        .select({ gross: sql<number>`coalesce(sum(${payouts.grossPaise}), 0)::int` })
        .from(payouts)
        .where(
          and(
            eq(payouts.mentorUserId, mentorUserId),
            gte(payouts.createdAt, fy.start),
            lt(payouts.createdAt, fy.end),
          ),
        );

      const gross = rows.reduce((sum, row) => sum + row.grossPaise, 0);
      const fee = rows.reduce((sum, row) => sum + row.platformFeePaise, 0);
      const tds = payoutTds({
        grossPaise: gross,
        hasPan: Boolean(account.panEnc),
        financialYearGrossBeforePaise: yearBefore?.gross ?? 0,
      });

      const [payout] = await tx
        .insert(payouts)
        .values({
          mentorUserId,
          periodStart,
          periodEnd,
          grossPaise: gross,
          platformFeePaise: fee,
          mentorSharePaise: mentorShare,
          tdsPaise: tds,
          netPaise: mentorShare - tds,
          method: account.method,
        })
        .returning({ id: payouts.id });
      await tx.insert(payoutItems).values(
        rows.map((row) => ({
          payoutId: payout!.id,
          bookingId: row.bookingId,
          grossPaise: row.grossPaise,
          platformFeePaise: row.platformFeePaise,
          mentorSharePaise: row.mentorSharePaise,
        })),
      );
      await writeAuditLog(tx, {
        actorUserId: adminId,
        action: "payout.created",
        entityType: "payout",
        entityId: payout!.id,
        details: { periodEnd, gross, tds, net: mentorShare - tds, bookings: rows.length },
      });
      return payout!.id;
    });
    if (id) created.push(id);
  }

  return { created: created.length, skipped };
}

const mentorUser = aliasedTable(users, "mentor_user");

export async function listPayouts(options: { periodEnd?: string; status?: string } = {}) {
  const conditions = [];
  if (options.periodEnd) conditions.push(eq(payouts.periodEnd, options.periodEnd));
  if (options.status === "pending" || options.status === "paid" || options.status === "on_hold") {
    conditions.push(eq(payouts.status, options.status));
  }
  return getDb()
    .select({
      id: payouts.id,
      mentorUserId: payouts.mentorUserId,
      mentorName: mentorUser.name,
      mentorEmail: mentorUser.email,
      periodStart: payouts.periodStart,
      periodEnd: payouts.periodEnd,
      grossPaise: payouts.grossPaise,
      platformFeePaise: payouts.platformFeePaise,
      mentorSharePaise: payouts.mentorSharePaise,
      tdsPaise: payouts.tdsPaise,
      netPaise: payouts.netPaise,
      status: payouts.status,
      method: payouts.method,
      reference: payouts.reference,
      paidAt: payouts.paidAt,
      itemCount: sql<number>`(select count(*)::int from ${payoutItems} i where i.payout_id = "payouts"."id")`,
    })
    .from(payouts)
    .innerJoin(mentorUser, eq(mentorUser.id, payouts.mentorUserId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(payouts.periodEnd), asc(mentorUser.name))
    .limit(500);
}

export async function payoutItemsFor(payoutId: string) {
  const aspirant = aliasedTable(users, "aspirant_user");
  return getDb()
    .select({
      bookingId: payoutItems.bookingId,
      grossPaise: payoutItems.grossPaise,
      platformFeePaise: payoutItems.platformFeePaise,
      mentorSharePaise: payoutItems.mentorSharePaise,
      startsAt: bookings.startsAt,
      durationMinutes: bookings.durationMinutes,
      status: bookings.status,
      aspirantName: aspirant.name,
    })
    .from(payoutItems)
    .innerJoin(bookings, eq(bookings.id, payoutItems.bookingId))
    .innerJoin(aspirant, eq(aspirant.id, bookings.aspirantUserId))
    .where(eq(payoutItems.payoutId, payoutId))
    .orderBy(asc(bookings.startsAt));
}

/** Escapes a value for CSV, and blocks spreadsheet formula injection. */
export function csvCell(value: string | number | null | undefined): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export const rupees = (paise: number) => (paise / 100).toFixed(2);

/** The most recent Sunday (IST) that has fully ended, as YYYY-MM-DD. */
export function lastCompletedSunday(now = new Date()): string {
  const ist = new Date(now.getTime() + 330 * 60_000);
  const day = ist.getUTCDay(); // 0 = Sunday
  const back = day === 0 ? 7 : day;
  const sunday = new Date(ist.getTime() - back * 24 * 60 * 60_000);
  return sunday.toISOString().slice(0, 10);
}
