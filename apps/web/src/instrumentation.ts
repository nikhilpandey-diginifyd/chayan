/**
 * Runs once when the server starts. Starts the scheduler that settles
 * no-shows, completes finished sessions and closes video rooms every minute.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_SCHEDULER === "1") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { startScheduler } = await import("@/lib/jobs");
  startScheduler();
}
