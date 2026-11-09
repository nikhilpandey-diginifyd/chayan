import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, mentorPayoutAccounts, payouts, users } from "@chayan/db";
import { formatRupees } from "@chayan/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { writeAuditLog } from "@/lib/audit";
import { formatSessionTime } from "@/lib/booking-emails";
import { decryptField } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { payoutItemsFor } from "@/lib/payouts";
import { requireRole } from "@/lib/session";
import { markPayoutPaid, setPayoutHold } from "../actions";

export const metadata: Metadata = { title: "Payout", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function AdminPayoutPage({ params }: Props) {
  const admin = await requireRole(["admin"], "/admin/payouts");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = getDb();
  const payout = await db.query.payouts.findFirst({ where: eq(payouts.id, id) });
  if (!payout) notFound();
  const [mentor, account, items] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, payout.mentorUserId),
      columns: { name: true, email: true },
    }),
    db.query.mentorPayoutAccounts.findFirst({
      where: eq(mentorPayoutAccounts.mentorUserId, payout.mentorUserId),
    }),
    payoutItemsFor(payout.id),
  ]);

  // Viewing full bank details is logged.
  if (account) {
    await writeAuditLog(db, {
      actorUserId: admin.id,
      action: "payout_account.viewed",
      entityType: "mentor",
      entityId: payout.mentorUserId,
      details: { payoutId: payout.id },
    });
  }

  return (
    <div className="py-10">
      <Link href="/admin/payouts" className="text-pen text-sm font-semibold">
        All payouts
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">{mentor?.name}</h1>
      <p className="text-ink-muted mt-1">
        Week {payout.periodStart} to {payout.periodEnd} · {mentor?.email}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-6">
          <h2 className="text-xl font-bold">Amounts</h2>
          <dl className="mt-4 space-y-2">
            {[
              ["Aspirants paid (after refunds)", payout.grossPaise],
              ["Platform fee", payout.platformFeePaise],
              ["Mentor share", payout.mentorSharePaise],
              ["TDS (194-O)", payout.tdsPaise],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between gap-3">
                <dt className="text-ink-muted">{label}</dt>
                <dd>{formatRupees(value as number)}</dd>
              </div>
            ))}
            <div className="border-line flex justify-between gap-3 border-t pt-2 text-lg">
              <dt className="font-semibold">To transfer</dt>
              <dd className="font-bold">{formatRupees(payout.netPaise)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm">
            Status:{" "}
            <strong>
              {payout.status === "paid"
                ? "Paid"
                : payout.status === "on_hold"
                  ? "On hold"
                  : "To pay"}
            </strong>
            {payout.reference ? ` · reference ${payout.reference}` : ""}
            {payout.note ? ` · ${payout.note}` : ""}
          </p>
          {payout.status === "pending" ? (
            <div className="mt-4 space-y-3">
              <form action={markPayoutPaid} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="payoutId" value={payout.id} />
                <Input
                  name="reference"
                  required
                  minLength={4}
                  placeholder="UTR / transfer reference"
                  aria-label="Transfer reference"
                  className="w-60"
                />
                <Button type="submit">Mark paid</Button>
              </form>
              <form action={setPayoutHold} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="payoutId" value={payout.id} />
                <input type="hidden" name="hold" value="true" />
                <Input
                  name="note"
                  placeholder="Reason (internal)"
                  aria-label="Reason for hold"
                  className="w-60"
                />
                <Button type="submit" variant="secondary">
                  Put on hold
                </Button>
              </form>
            </div>
          ) : payout.status === "on_hold" ? (
            <form action={setPayoutHold} className="mt-4">
              <input type="hidden" name="payoutId" value={payout.id} />
              <input type="hidden" name="hold" value="false" />
              <Button type="submit" variant="secondary">
                Release hold
              </Button>
            </form>
          ) : null}
        </section>

        <section className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-6">
          <h2 className="text-xl font-bold">Pay to</h2>
          {account ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Name</dt>
                <dd className="font-semibold">{account.accountHolderName}</dd>
              </div>
              {account.method === "bank" ? (
                <>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">Account number</dt>
                    <dd className="font-mono">{decryptField(account.accountNumberEnc)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-muted">IFSC</dt>
                    <dd className="font-mono">{account.ifsc}</dd>
                  </div>
                </>
              ) : (
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">UPI ID</dt>
                  <dd className="font-mono">{decryptField(account.upiIdEnc)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">PAN</dt>
                <dd className="font-mono">{decryptField(account.panEnc)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-omr mt-2">The mentor removed their payout details.</p>
          )}
          <p className="text-ink-muted mt-4 text-xs">
            Viewing these details is recorded in the audit log.
          </p>
        </section>
      </div>

      <h2 className="mt-10 text-xl font-bold">Sessions in this payout</h2>
      <ul className="divide-line border-line bg-surface mt-4 divide-y rounded-[var(--radius-control)] border text-sm">
        {items.map((item) => (
          <li key={item.bookingId} className="flex flex-wrap justify-between gap-3 px-4 py-2">
            <Link href={`/bookings/${item.bookingId}`} className="text-pen">
              {formatSessionTime(item.startsAt)} · {item.durationMinutes} min with{" "}
              {item.aspirantName}
            </Link>
            <span>
              {formatRupees(item.grossPaise)} paid → {formatRupees(item.mentorSharePaise)} to mentor
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
