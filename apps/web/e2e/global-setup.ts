import { request } from "@playwright/test";

/**
 * Warms up the dev server: compiles every page once before the tests start,
 * so the browser never sees a page reload in the middle of a test.
 */
const ROUTES = [
  "/",
  "/sign-in",
  "/sign-up",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/dashboard",
  "/mentors",
  "/mentors/warm-up",
  "/mentor",
  "/mentor/apply",
  "/mentor/profile",
  "/mentor/sessions",
  "/mentor/availability",
  "/mentor/earnings",
  "/mentor/bookings",
  "/bookings",
  "/bookings/00000000-0000-0000-0000-000000000000",
  "/bookings/00000000-0000-0000-0000-000000000000/pay",
  "/bookings/00000000-0000-0000-0000-000000000000/call",
  "/papers",
  "/papers/warm-up",
  "/videos",
  "/videos/warm-up",
  "/admin",
  "/admin/mentors",
  "/admin/bookings",
  "/admin/payouts",
  "/admin/reviews",
  "/admin/papers",
  "/admin/videos",
  "/api/auth/get-session",
  // API routes compile on first use too.
  "/api/admin/papers",
  "/api/admin/payouts/export",
  "/api/papers/00000000-0000-0000-0000-000000000000/download",
  "/api/mentor/documents",
  "/api/mentor/photo",
  "/api/documents/00000000-0000-0000-0000-000000000000",
  "/api/bookings/00000000-0000-0000-0000-000000000000/attachments",
  "/api/booking-files/00000000-0000-0000-0000-000000000000",
  "/api/sessions/00000000-0000-0000-0000-000000000000/join",
  "/api/sessions/00000000-0000-0000-0000-000000000000/presence",
  "/api/cron/tick",
];

export default async function globalSetup() {
  const context = await request.newContext({ baseURL: "http://localhost:3000" });
  for (const route of ROUTES) {
    await context.get(route, { timeout: 120_000, maxRedirects: 0 }).catch(() => {});
  }
  await context.dispose();
}
