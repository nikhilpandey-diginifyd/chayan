import "server-only";
import { appRateLimits, lt, sql } from "@chayan/db";
import { getDb } from "@/lib/db";

export type RateLimitRule = { limit: number; windowSeconds: number };

/** Limits for actions that write data or cost money. Generous for real people, tight for scripts. */
export const RATE_LIMITS = {
  mentorDocumentUpload: { limit: 30, windowSeconds: 3600 },
  mentorPhotoUpload: { limit: 10, windowSeconds: 3600 },
  sessionFileUpload: { limit: 30, windowSeconds: 3600 },
  createBooking: { limit: 10, windowSeconds: 600 },
  joinCall: { limit: 60, windowSeconds: 600 },
  saveReview: { limit: 20, windowSeconds: 3600 },
} satisfies Record<string, RateLimitRule>;

/**
 * Counts one attempt for `key` and says whether it's allowed. Uses a fixed
 * window stored in Postgres, so limits hold across restarts and servers.
 */
export async function consumeRateLimit(
  name: keyof typeof RATE_LIMITS,
  subject: string,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const rule = RATE_LIMITS[name];
  const key = `${name}:${subject}`;
  const rows = await getDb().execute<{ count: number; window_start: string }>(sql`
    insert into ${appRateLimits} (key, count, window_start) values (${key}, 1, now())
    on conflict (key) do update set
      count = case when ${appRateLimits.windowStart} < now() - make_interval(secs => ${rule.windowSeconds}) then 1 else ${appRateLimits.count} + 1 end,
      window_start = case when ${appRateLimits.windowStart} < now() - make_interval(secs => ${rule.windowSeconds}) then now() else ${appRateLimits.windowStart} end
    returning count, window_start`);
  const row = [...rows][0];
  const count = Number(row?.count ?? 1);
  const windowStart = row ? new Date(row.window_start).getTime() : Date.now();
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((windowStart + rule.windowSeconds * 1000 - Date.now()) / 1000),
  );
  return { allowed: count <= rule.limit, retryAfterSeconds };
}

export function tooManyRequests(retryAfterSeconds: number) {
  return Response.json(
    { error: "Too many attempts. Wait a few minutes and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/** Housekeeping: drop counters older than a day. */
export async function pruneRateLimits() {
  await getDb()
    .delete(appRateLimits)
    .where(lt(appRateLimits.windowStart, sql`now() - interval '1 day'`));
}
