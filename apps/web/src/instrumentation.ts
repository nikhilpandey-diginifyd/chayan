import * as Sentry from "@sentry/nextjs";

/**
 * Runs once when the server starts: error monitoring (if SENTRY_DSN is set)
 * and the scheduler that settles no-shows, completes sessions and sends
 * reminders every minute.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }

  if (process.env.DISABLE_SCHEDULER === "1") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const { startScheduler } = await import("@/lib/jobs");
  startScheduler();
}

/** Reports errors thrown while rendering pages and route handlers. */
export const onRequestError = Sentry.captureRequestError;
