import { expect, test } from "@playwright/test";
import { createAspirant, createPublishedMentor, insertBooking } from "./helpers";

test("security headers are sent on every page", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("https://checkout.razorpay.com");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["strict-transport-security"]).toContain("max-age=");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("people can't open other people's bookings, calls, files or admin pages", async ({
  browser,
}) => {
  const mentorPage = await (await browser.newContext()).newPage();
  const mentor = await createPublishedMentor(mentorPage);
  const ownerPage = await (await browser.newContext()).newPage();
  const owner = await createAspirant(ownerPage, "Booking Owner");
  const booking = await insertBooking({
    aspirantId: owner.id,
    mentorId: mentor.id,
    startOffsetMinutes: 5,
  });

  const stranger = await (await browser.newContext()).newPage();
  await createAspirant(stranger, "Curious Stranger");
  expect((await stranger.goto(`/bookings/${booking}`))!.status()).toBe(404);
  expect((await stranger.goto(`/bookings/${booking}/call`))!.status()).toBe(404);
  expect((await stranger.request.post(`/api/sessions/${booking}/join`)).status()).toBe(404);
  expect((await stranger.request.get(`/api/bookings/${booking}/attachments`)).status()).toBe(404);
  expect((await stranger.goto("/admin"))!.status()).toBe(404);
  expect((await stranger.goto("/admin/payouts"))!.status()).toBe(404);
  expect(
    (await stranger.request.get("/api/admin/payouts/export?type=tds&fy=2026-27")).status(),
  ).toBe(404);
  expect(
    (await stranger.request.post("/api/admin/papers", { multipart: { title: "x" } })).status(),
  ).toBe(403);
});

test("signed-out visitors are sent to sign in for private pages", async ({ page }) => {
  for (const path of ["/dashboard", "/bookings", "/mentor", "/admin", "/onboarding"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/sign-in\\?next=${encodeURIComponent(path)}`));
  }
});
