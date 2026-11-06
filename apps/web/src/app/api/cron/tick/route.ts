import { getServerEnv } from "@/env";
import { runScheduledWork } from "@/lib/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Optional external trigger for scheduled work (for example a Coolify
 * scheduled task with curl). Requires `Authorization: Bearer <CRON_SECRET>`.
 * Without CRON_SECRET it only works in development.
 */
export async function POST(request: Request) {
  const env = getServerEnv();
  if (env.CRON_SECRET) {
    if (request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  } else if (env.NODE_ENV === "production") {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await runScheduledWork();
  return Response.json(result);
}
