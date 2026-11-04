import "server-only";
import { createDb, type Database } from "@chayan/db";
import { getServerEnv } from "@/env";

// Reuse one connection pool across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Database };

export function getDb(): Database {
  if (!globalForDb.db) {
    globalForDb.db = createDb(getServerEnv().DATABASE_URL);
  }
  return globalForDb.db;
}
