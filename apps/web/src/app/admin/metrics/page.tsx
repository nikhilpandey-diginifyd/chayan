import type { Metadata } from "next";
import Link from "next/link";
import { BadgeIndianRupee, CalendarPlus, ClipboardList, Repeat, UserPlus } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import {
  getMetrics,
  METRICS_PERIODS,
  sumMetrics,
  type MetricKey,
  type MetricsView,
} from "@/lib/metrics";
import { requireRole } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Metrics", robots: { index: false } };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const columns: { key: MetricKey; label: string; icon: typeof UserPlus }[] = [
  { key: "signups", label: "Sign-ups", icon: UserPlus },
  { key: "applications", label: "Mentor applications", icon: ClipboardList },
  { key: "bookings", label: "Bookings started", icon: CalendarPlus },
  { key: "paid", label: "Paid sessions", icon: BadgeIndianRupee },
  { key: "repeat", label: "Repeat bookings", icon: Repeat },
];

const dayFormat = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const weekFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function bucketLabel(bucket: string, view: MetricsView) {
  const date = new Date(`${bucket}T00:00:00Z`);
  return view === "day" ? dayFormat.format(date) : `Week of ${weekFormat.format(date)}`;
}

export default async function AdminMetricsPage({ searchParams }: Props) {
  await requireRole(["admin"], "/admin/metrics");
  const params = await searchParams;
  const view: MetricsView = params.view === "week" ? "week" : "day";
  const rows = await getMetrics(view);
  const totals = sumMetrics(rows);
  const repeatShare = totals.paid > 0 ? Math.round((totals.repeat / totals.paid) * 100) : null;
  const windowLabel =
    view === "day" ? `last ${METRICS_PERIODS.day} days` : `last ${METRICS_PERIODS.week} weeks`;

  return (
    <div className="py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">Metrics</h1>
          <p className="text-ink-muted mt-2">
            Straight from our database, in India time. Weeks start on Monday.
          </p>
        </div>
        <div
          role="group"
          aria-label="Group by"
          className="border-line bg-surface inline-flex rounded-[var(--radius-control)] border p-1"
        >
          {(["day", "week"] as const).map((option) => (
            <Link
              key={option}
              href={option === "day" ? "/admin/metrics" : "/admin/metrics?view=week"}
              aria-current={view === option ? "page" : undefined}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold",
                view === option ? "bg-pen text-white" : "text-ink-muted hover:text-ink",
              )}
            >
              {option === "day" ? "Daily" : "Weekly"}
            </Link>
          ))}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-bold">Totals for the {windowLabel}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {columns.map((column) => (
          <StatCard key={column.key} icon={column.icon} label={column.label}>
            {totals[column.key]}
          </StatCard>
        ))}
      </dl>
      <p className="text-ink-muted mt-3 text-sm">
        {repeatShare === null
          ? "No paid sessions yet in this period."
          : `${repeatShare}% of paid sessions came from aspirants who had paid before.`}
      </p>

      <h2 className="mt-10 text-lg font-bold">{view === "day" ? "By day" : "By week"}</h2>
      <div className="border-line bg-surface mt-4 overflow-x-auto rounded-[var(--radius-control)] border">
        <table className="data-table w-full min-w-[640px] text-left text-sm">
          <thead className="border-line text-ink-muted border-b">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                {view === "day" ? "Day" : "Week"}
              </th>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-4 py-3 text-right font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-line divide-y">
            {rows.map((row) => (
              <tr key={row.bucket}>
                <th scope="row" className="px-4 py-3 font-medium whitespace-nowrap">
                  {bucketLabel(row.bucket, view)}
                </th>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "px-4 py-3 text-right tabular-nums",
                      row[column.key] === 0 && "text-ink-muted",
                    )}
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-ink-muted mt-3 text-sm">
        Bookings started includes unpaid holds. Paid sessions are counted on the day of payment and
        include ones refunded later. Mentor applications are counted on their latest submission.
      </p>
    </div>
  );
}
