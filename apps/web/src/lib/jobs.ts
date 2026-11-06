import "server-only";
import { jobLocks, sql } from "@chayan/db";
import { getDb } from "@/lib/db";
import { runSessionHousekeeping } from "@/lib/sessions";

const LOCK_NAME = "scheduled-work";
const LEASE_SECONDS = 55;

/**
 * Runs scheduled work if no other server holds the lease. Safe to call from
 * several app instances and from the cron endpoint at the same time.
 */
export async function runScheduledWork(): Promise<{ ran: boolean; summary?: unknown }> {
  const db = getDb();
  const [lease] = await db
    .insert(jobLocks)
    .values({ name: LOCK_NAME, lockedUntil: sql`now() + make_interval(secs => ${LEASE_SECONDS})` })
    .onConflictDoUpdate({
      target: jobLocks.name,
      set: { lockedUntil: sql`now() + make_interval(secs => ${LEASE_SECONDS})` },
      setWhere: sql`${jobLocks.lockedUntil} < now()`,
    })
    .returning({ name: jobLocks.name });
  if (!lease) return { ran: false };

  try {
    const summary = await runSessionHousekeeping();
    return { ran: true, summary };
  } finally {
    await db
      .update(jobLocks)
      .set({ lockedUntil: sql`now()`, lastRunAt: sql`now()` })
      .where(sql`${jobLocks.name} = ${LOCK_NAME}`);
  }
}

const globalForJobs = globalThis as unknown as { jobTimer?: ReturnType<typeof setInterval> };

/** Starts the once-a-minute loop inside the web server process. */
export function startScheduler() {
  if (globalForJobs.jobTimer) return;
  const tick = () =>
    runScheduledWork().catch((error: unknown) => console.error("Scheduled work failed", error));
  globalForJobs.jobTimer = setInterval(tick, 60_000);
  setTimeout(tick, 5_000);
}
