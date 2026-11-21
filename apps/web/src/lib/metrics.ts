import "server-only";
import { sql } from "@chayan/db";
import { getDb } from "@/lib/db";

export type MetricsView = "day" | "week";

export const METRICS_PERIODS: Record<MetricsView, number> = { day: 14, week: 12 };

export type MetricsRow = {
  /** Start of the day or week (Monday) in India time, as YYYY-MM-DD */
  bucket: string;
  signups: number;
  applications: number;
  bookings: number;
  paid: number;
  repeat: number;
};

export type MetricKey = Exclude<keyof MetricsRow, "bucket">;

/**
 * Growth numbers straight from the database, per India-time day or week, newest
 * first. Periods with nothing in them still appear, with zeros.
 *
 * - signups: new accounts
 * - applications: mentor applications submitted (by latest submission)
 * - bookings: bookings started, paid or not
 * - paid: bookings with a captured payment, counted when first paid (refunded ones included)
 * - repeat: paid bookings from an aspirant who had already paid for an earlier one
 */
export async function getMetrics(view: MetricsView): Promise<MetricsRow[]> {
  const step = view === "day" ? "1 day" : "1 week";
  const periods = METRICS_PERIODS[view];
  const rows = await getDb().execute<MetricsRow>(sql`
    with buckets as (
      select generate_series(
        date_trunc(${view}::text, now() at time zone 'Asia/Kolkata') - ${periods - 1}::int * ${step}::interval,
        date_trunc(${view}::text, now() at time zone 'Asia/Kolkata'),
        ${step}::interval
      ) as bucket
    ),
    paid as (
      select b.aspirant_user_id, min(p.captured_at) as paid_at
      from bookings b
      join payments p on p.booking_id = b.id
      where p.captured_at is not null
      group by b.id, b.aspirant_user_id
    ),
    paid_ranked as (
      select paid_at, row_number() over (partition by aspirant_user_id order by paid_at) as n
      from paid
    ),
    events as (
      select 'signups' as metric, created_at as at from users
      union all
      select 'applications', submitted_at from mentor_applications where submitted_at is not null
      union all
      select 'bookings', created_at from bookings
      union all
      select 'paid', paid_at from paid_ranked
      union all
      select 'repeat', paid_at from paid_ranked where n > 1
    )
    select
      to_char(bk.bucket, 'YYYY-MM-DD') as bucket,
      count(*) filter (where e.metric = 'signups')::int as signups,
      count(*) filter (where e.metric = 'applications')::int as applications,
      count(*) filter (where e.metric = 'bookings')::int as bookings,
      count(*) filter (where e.metric = 'paid')::int as paid,
      count(*) filter (where e.metric = 'repeat')::int as repeat
    from buckets bk
    left join events e
      on date_trunc(${view}::text, e.at at time zone 'Asia/Kolkata') = bk.bucket
    group by bk.bucket
    order by bk.bucket desc
  `);
  return [...rows];
}

export function sumMetrics(rows: MetricsRow[]): Record<MetricKey, number> {
  const totals = { signups: 0, applications: 0, bookings: 0, paid: 0, repeat: 0 };
  for (const row of rows) {
    for (const key of Object.keys(totals) as MetricKey[]) totals[key] += row[key];
  }
  return totals;
}
