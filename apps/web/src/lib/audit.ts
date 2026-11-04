import "server-only";
import { auditLogs } from "@chayan/db";
import type { Database } from "@chayan/db";

type Executor = Pick<Database, "insert">;

export async function writeAuditLog(
  db: Executor,
  entry: {
    actorUserId: string | null;
    action: string;
    entityType: string;
    entityId: string;
    details?: Record<string, unknown>;
  },
) {
  await db.insert(auditLogs).values(entry);
}
