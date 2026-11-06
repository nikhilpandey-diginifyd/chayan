import type { Metadata } from "next";
import { desc, eq, mentorPayoutAccounts, payouts } from "@chayan/db";
import { formatRupees, PAYOUT_POLICY } from "@chayan/shared";
import { PayoutAccountSection } from "@/components/mentor/payout-account-form";
import { formatSessionTime } from "@/lib/booking-emails";
import { getDb } from "@/lib/db";
import { requireMentor } from "@/lib/mentor-profile";
import { payoutItemsFor, unpaidEarnings } from "@/lib/payouts";

export const metadata: Metadata = { title: "Earnings", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});
const fmtDate = (value: string) => dateFormat.format(new Date(`${value}T12:00:00+05:30`));

function tomorrow() {
  return new Date(Date.now() + 24 * 60 * 60_000);
}

export default async function MentorEarningsPage() {
  const { mentor } = await requireMentor("/mentor/earnings");
  const db = getDb();
  const [account, history, unpaid] = await Promise.all([
    db.query.mentorPayoutAccounts.findFirst({
      where: eq(mentorPayoutAccounts.mentorUserId, mentor.userId),
    }),
    db
      .select()
      .from(payouts)
      .where(eq(payouts.mentorUserId, mentor.userId))
      .orderBy(desc(payouts.periodEnd))
      .limit(52),
    unpaidEarnings({ mentorUserId: mentor.userId, endedBefore: tomorrow() }),
  ]);
  const unpaidTotal = unpaid.reduce((sum, row) => sum + row.mentorSharePaise, 0);
  const itemsByPayout = new Map(
    await Promise.all(
      history
        .slice(0, 5)
        .map(async (payout) => [payout.id, await payoutItemsFor(payout.id)] as const),
    ),
  );

  return (
    <div className="max-w-4xl py-10">
      <h1 className="text-3xl font-extrabold">Earnings</h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        You receive 80% of what aspirants pay, minus any tax deducted at source. Payouts go out
        weekly for sessions that ended at least {PAYOUT_POLICY.holdHours} hours earlier.
      </p>

      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Payout details</h2>
        {!account ? (
          <p className="text-omr mt-2 text-sm font-semibold">
            Add these to receive payouts. Until then, earnings wait for you.
          </p>
        ) : null}
        <div className="mt-4">
          <PayoutAccountSection
            saved={
              account
                ? {
                    method: account.method,
                    accountHolderName: account.accountHolderName,
                    accountNumberLast4: account.accountNumberLast4,
                    ifsc: account.ifsc,
                    upiIdMasked: account.upiIdMasked,
                    panLast4: account.panLast4,
                  }
                : null
            }
          />
        </div>
      </section>

      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Not paid yet</h2>
        <p className="mt-1 text-3xl font-bold">{formatRupees(unpaidTotal)}</p>
        <p className="text-ink-muted text-sm">
          From {unpaid.length} session{unpaid.length === 1 ? "" : "s"}, before tax deducted at
          source.
        </p>
        {unpaid.length > 0 ? (
          <ul className="divide-line mt-4 divide-y text-sm">
            {unpaid.map((row) => (
              <li key={row.bookingId} className="flex justify-between gap-3 py-2">
                <span>
                  {formatSessionTime(row.startsAt)}
                  {row.status !== "completed" ? (
                    <span className="text-ink-muted"> (part refund)</span>
                  ) : null}
                </span>
                <span className="font-semibold">{formatRupees(row.mentorSharePaise)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Payouts</h2>
        {history.length === 0 ? (
          <p className="text-ink-muted mt-2">No payouts yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {history.map((payout) => {
              const items = itemsByPayout.get(payout.id);
              return (
                <li
                  key={payout.id}
                  className="border-line rounded-[var(--radius-control)] border p-4"
                >
                  <details>
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">
                        {fmtDate(payout.periodStart)} to {fmtDate(payout.periodEnd)}
                      </span>
                      <span>
                        <strong>{formatRupees(payout.netPaise)}</strong>{" "}
                        <span className={payout.status === "paid" ? "text-seal" : "text-ink-muted"}>
                          {payout.status === "paid"
                            ? `paid ${payout.paidAt ? dateFormat.format(payout.paidAt) : ""}`
                            : payout.status === "on_hold"
                              ? "on hold"
                              : "processing"}
                        </span>
                      </span>
                    </summary>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-ink-muted">Aspirants paid</dt>
                        <dd>{formatRupees(payout.grossPaise)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">Platform fee</dt>
                        <dd>{formatRupees(payout.platformFeePaise)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">TDS</dt>
                        <dd>{formatRupees(payout.tdsPaise)}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">You receive</dt>
                        <dd className="font-semibold">{formatRupees(payout.netPaise)}</dd>
                      </div>
                    </dl>
                    {payout.reference ? (
                      <p className="text-ink-muted mt-2 text-sm">
                        Transfer reference: {payout.reference}
                      </p>
                    ) : null}
                    {items ? (
                      <ul className="divide-line border-line mt-3 divide-y border-t text-sm">
                        {items.map((item) => (
                          <li key={item.bookingId} className="flex justify-between gap-3 py-1.5">
                            <span>
                              {formatSessionTime(item.startsAt)} · {item.aspirantName}
                            </span>
                            <span>{formatRupees(item.mentorSharePaise)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
