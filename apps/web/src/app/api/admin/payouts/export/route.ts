import {
  aliasedTable,
  and,
  asc,
  eq,
  gte,
  lt,
  mentorPayoutAccounts,
  payouts,
  users,
} from "@chayan/db";
import { userRoleSchema } from "@chayan/shared";
import { writeAuditLog } from "@/lib/audit";
import { getAuth } from "@/lib/auth";
import { decryptField } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { rupees, toCsv } from "@/lib/payouts";

export const runtime = "nodejs";

const mentorUser = aliasedTable(users, "mentor_user");

/**
 * Admin CSV exports.
 * - type=bank&periodEnd=YYYY-MM-DD: unpaid payouts for that week, for bank uploads
 * - type=tds&fy=2026-27: every paid payout in the financial year, for TDS returns
 */
export async function GET(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session || userRoleSchema.catch("aspirant").parse(session.user.role) !== "admin") {
    return new Response("Not found", { status: 404 });
  }
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const db = getDb();

  const base = db
    .select({
      payout: payouts,
      mentorName: mentorUser.name,
      mentorEmail: mentorUser.email,
      account: mentorPayoutAccounts,
    })
    .from(payouts)
    .innerJoin(mentorUser, eq(mentorUser.id, payouts.mentorUserId))
    .leftJoin(mentorPayoutAccounts, eq(mentorPayoutAccounts.mentorUserId, payouts.mentorUserId));

  let csv: string;
  let fileName: string;

  if (type === "bank") {
    const periodEnd = url.searchParams.get("periodEnd") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(periodEnd)) return new Response("Bad request", { status: 400 });
    const rows = await base
      .where(and(eq(payouts.periodEnd, periodEnd), eq(payouts.status, "pending")))
      .orderBy(asc(mentorUser.name));
    csv = toCsv([
      [
        "Payout ID",
        "Mentor",
        "Email",
        "Method",
        "Account holder",
        "Account number",
        "IFSC",
        "UPI ID",
        "Amount (INR)",
        "Reference",
      ],
      ...rows.map((row) => [
        row.payout.id,
        row.mentorName,
        row.mentorEmail,
        row.payout.method,
        row.account?.accountHolderName ?? "",
        decryptField(row.account?.accountNumberEnc ?? null) ?? "",
        row.account?.ifsc ?? "",
        decryptField(row.account?.upiIdEnc ?? null) ?? "",
        rupees(row.payout.netPaise),
        "",
      ]),
    ]);
    fileName = `payouts-${periodEnd}.csv`;
  } else if (type === "tds") {
    const fy = url.searchParams.get("fy") ?? "";
    const match = fy.match(/^(\d{4})-\d{2}$/);
    if (!match) return new Response("Bad request", { status: 400 });
    const startYear = Number(match[1]);
    const start = new Date(Date.UTC(startYear, 3, 1) - 330 * 60_000);
    const end = new Date(Date.UTC(startYear + 1, 3, 1) - 330 * 60_000);
    const rows = await base
      .where(and(eq(payouts.status, "paid"), gte(payouts.paidAt, start), lt(payouts.paidAt, end)))
      .orderBy(asc(payouts.paidAt));
    csv = toCsv([
      [
        "Paid on",
        "Mentor",
        "PAN",
        "Week",
        "Gross amount (INR)",
        "TDS (INR)",
        "Mentor share (INR)",
        "Net paid (INR)",
        "Reference",
      ],
      ...rows.map((row) => [
        row.payout.paidAt?.toISOString().slice(0, 10) ?? "",
        row.account?.accountHolderName ?? row.mentorName,
        decryptField(row.account?.panEnc ?? null) ?? "",
        `${row.payout.periodStart} to ${row.payout.periodEnd}`,
        rupees(row.payout.grossPaise),
        rupees(row.payout.tdsPaise),
        rupees(row.payout.mentorSharePaise),
        rupees(row.payout.netPaise),
        row.payout.reference ?? "",
      ]),
    ]);
    fileName = `tds-${fy}.csv`;
  } else {
    return new Response("Bad request", { status: 400 });
  }

  await writeAuditLog(db, {
    actorUserId: session.user.id,
    action: `export.${type}`,
    entityType: "payouts",
    entityId: fileName,
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
