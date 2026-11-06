import type { Metadata } from "next";
import Link from "next/link";
import { formatRupees, financialYear, PAYOUT_POLICY } from "@chayan/shared";
import { GeneratePayoutsForm } from "@/components/admin/generate-payouts-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { lastCompletedSunday, listPayouts } from "@/lib/payouts";
import { getFinanceSummary } from "@/lib/finance";
import { requireRole } from "@/lib/session";
import { markPayoutPaid } from "./actions";

export const metadata: Metadata = { title: "Payouts", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const statusText = { pending: "To pay", paid: "Paid", on_hold: "On hold" } as const;

export default async function AdminPayoutsPage({ searchParams }: Props) {
  await requireRole(["admin"], "/admin/payouts");
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "pending";
  const [rows, finance] = await Promise.all([
    listPayouts({ status: status === "all" ? undefined : status }),
    getFinanceSummary(),
  ]);
  const weeks = [...new Set(rows.map((row) => row.periodEnd))];
  const fy = financialYear(new Date()).label;

  return (
    <div className="py-10">
      <h1 className="text-3xl font-extrabold">Payouts</h1>

      <dl className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          ["Collected", finance.collectedPaise],
          ["Refunded", finance.refundedPaise],
          ["Platform fees earned", finance.platformFeePaise],
          ["Paid to mentors", finance.paidOutPaise],
          ["Owed to mentors", finance.owedPaise],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="border-line bg-surface rounded-[var(--radius-control)] border p-4"
          >
            <dt className="text-ink-muted text-sm">{label}</dt>
            <dd className="mt-1 text-xl font-bold">{formatRupees(value as number)}</dd>
          </div>
        ))}
      </dl>

      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Create this week&apos;s payouts</h2>
        <p className="text-ink-muted mt-1 max-w-prose text-sm">
          Includes every unpaid session that ended before the end of that week and at least{" "}
          {PAYOUT_POLICY.holdHours} hours ago. TDS is worked out per mentor for the financial year.
          Running it twice for the same week doesn&apos;t create duplicates.
        </p>
        <div className="mt-4">
          <GeneratePayoutsForm defaultPeriodEnd={lastCompletedSunday()} />
        </div>
      </section>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["pending", "on_hold", "paid", "all"] as const).map((tab) => (
            <Link
              key={tab}
              href={`/admin/payouts?status=${tab}`}
              aria-current={tab === status ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${tab === status ? "border-pen bg-pen text-white" : "border-line bg-surface text-ink-muted hover:text-ink"}`}
            >
              {tab === "all" ? "All" : statusText[tab]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {weeks[0] ? (
            <a
              href={`/api/admin/payouts/export?type=bank&periodEnd=${weeks[0]}`}
              className="text-pen font-semibold"
            >
              Bank transfer sheet (week ending {weeks[0]})
            </a>
          ) : null}
          <a
            href={`/api/admin/payouts/export?type=tds&fy=${fy}`}
            className="text-pen font-semibold"
          >
            TDS report FY {fy}
          </a>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-ink-muted mt-6">No payouts here.</p>
      ) : (
        <div className="border-line bg-surface mt-4 overflow-x-auto rounded-[var(--radius-control)] border">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-line text-ink-muted border-b">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Mentor
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Week
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Sessions
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Mentor share
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  TDS
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  To pay
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
                    <Link href={`/admin/payouts/${row.id}`} className="text-pen font-semibold">
                      {row.mentorName}
                    </Link>
                    <span className="text-ink-muted block">
                      {row.method === "bank" ? "Bank" : "UPI"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.periodStart} to {row.periodEnd}
                  </td>
                  <td className="px-4 py-3">{row.itemCount}</td>
                  <td className="px-4 py-3">{formatRupees(row.mentorSharePaise)}</td>
                  <td className="px-4 py-3">{formatRupees(row.tdsPaise)}</td>
                  <td className="px-4 py-3 font-semibold">{formatRupees(row.netPaise)}</td>
                  <td className="px-4 py-3">
                    {row.status === "pending" ? (
                      <form action={markPayoutPaid} className="flex items-center gap-2">
                        <input type="hidden" name="payoutId" value={row.id} />
                        <Input
                          name="reference"
                          required
                          minLength={4}
                          placeholder="UTR / reference"
                          aria-label={`Transfer reference for ${row.mentorName}`}
                          className="h-9 w-40 text-sm"
                        />
                        <Button type="submit" size="sm">
                          Mark paid
                        </Button>
                      </form>
                    ) : (
                      <span>
                        {statusText[row.status]}
                        {row.reference ? (
                          <span className="text-ink-muted block">{row.reference}</span>
                        ) : null}
                      </span>
                    )}
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
