import * as Sentry from "@sentry/nextjs";
import { clientEnv } from "@/env";
import { startAnalytics } from "@/lib/analytics";

// Browser error monitoring. Does nothing unless NEXT_PUBLIC_SENTRY_DSN is set.
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}

// Product analytics. Does nothing (and downloads nothing) unless NEXT_PUBLIC_POSTHOG_KEY is set.
void startAnalytics(clientEnv.NEXT_PUBLIC_POSTHOG_KEY, clientEnv.NEXT_PUBLIC_POSTHOG_HOST);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
