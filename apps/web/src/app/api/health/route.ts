import { sql } from "@chayan/db";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Used by Coolify and UptimeRobot. Returns 503 if the database is unreachable. */
export async function GET() {
  const startedAt = Date.now();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json(
      { status: "ok", database: "ok", latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Health check failed", error);
    return Response.json(
      { status: "error", database: "unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
