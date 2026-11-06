import { expect, test } from "@playwright/test";
import {
  createAspirant,
  createPublishedMentor,
  db,
  signIn,
  signOut,
  waitForEmail,
} from "./helpers";

test("book, pay in test mode, reschedule and cancel with a full refund", async ({ browser }) => {
  const mentorPage = await (await browser.newContext()).newPage();
  const mentor = await createPublishedMentor(mentorPage);

  const page = await (await browser.newContext()).newPage();
  const aspirant = await createAspirant(page);

  await page.goto(`/mentors/${mentor.slug}`);
  await page.getByText("30 min", { exact: true }).click();
  await page.locator("fieldset", { hasText: "Day (IST)" }).locator("label").nth(2).click();
  await page.locator("fieldset", { hasText: "Start time" }).locator("label").first().click();
  await page.fill("#note", "Plan for Mains answer writing");
  await page.getByRole("button", { name: /Continue to pay ₹299/ }).click();
  await expect(page).toHaveURL(/\/bookings\/[0-9a-f-]+\/pay$/);
  await expect(page.getByRole("timer")).toContainText("Slot held for you");

  await page.getByRole("button", { name: /Pay ₹299 \(test mode\)/ }).click();
  await expect(page).toHaveURL(/\?paid=1$/);
  await expect(page.getByText("Payment received")).toBeVisible();
  await waitForEmail(aspirant.email, /Booked: 30 min/);
  await waitForEmail(mentor.email, /New booking/);

  await page.getByRole("button", { name: "Move to another time" }).click();
  await page
    .locator("form", { hasText: "Pick a new time" })
    .locator("button[aria-pressed]")
    .nth(1)
    .click();
  await page.getByRole("button", { name: "Move session" }).click();
  await expect(page.getByText("Pick a new time")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Move to another time" })).toHaveCount(0);

  await page.getByRole("button", { name: "Cancel session" }).click();
  await expect(page.getByText(/full refund of ₹299/)).toBeVisible();
  await page.getByRole("button", { name: "Yes, cancel" }).click();
  await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
  await expect(page.getByText(/Refund of ₹299: processed/)).toBeVisible();
});

test("a held slot disappears for others; mentors must give a reason to cancel", async ({
  browser,
}) => {
  const mentorPage = await (await browser.newContext()).newPage();
  const mentor = await createPublishedMentor(mentorPage);
  const first = await (await browser.newContext()).newPage();
  await createAspirant(first, "First Booker");
  const second = await (await browser.newContext()).newPage();
  await createAspirant(second, "Second Booker");

  await first.goto(`/mentors/${mentor.slug}`);
  await first.getByText("60 min", { exact: true }).click();
  await first.locator("fieldset", { hasText: "Day (IST)" }).locator("label").nth(1).click();
  const held = (
    await first.locator("fieldset", { hasText: "Start time" }).locator("label").first().innerText()
  ).trim();
  await first.locator("fieldset", { hasText: "Start time" }).locator("label").first().click();
  await first.getByRole("button", { name: /Continue to pay/ }).click();
  await expect(first).toHaveURL(/\/pay$/);

  await second.goto(`/mentors/${mentor.slug}`);
  await second.getByText("60 min", { exact: true }).click();
  await second.locator("fieldset", { hasText: "Day (IST)" }).locator("label").nth(1).click();
  const times = (
    await second.locator("fieldset", { hasText: "Start time" }).locator("label").allInnerTexts()
  ).map((t) => t.trim());
  expect(times).not.toContain(held);

  await first.getByRole("button", { name: /test mode/ }).click();
  await expect(first).toHaveURL(/\?paid=1$/);
  const bookingId = first.url().split("/bookings/")[1]!.split("?")[0]!;

  await mentorPage.goto(`/bookings/${bookingId}`);
  await mentorPage.getByRole("button", { name: "Cancel session" }).click();
  await mentorPage.getByRole("button", { name: "Yes, cancel" }).click();
  await expect(mentorPage.getByText("Tell the aspirant briefly why")).toBeVisible();
  await mentorPage.fill("#reason", "Unwell, sorry.");
  await mentorPage.getByRole("button", { name: "Yes, cancel" }).click();
  await expect(mentorPage.getByText("Cancelled by mentor")).toBeVisible();
});

test("the database refuses overlapping bookings for one mentor", async ({ browser }) => {
  const page = await (await browser.newContext()).newPage();
  const mentor = await createPublishedMentor(page);
  await signOut(page);
  const aspirant = await createAspirant(page);
  const sql = db();
  const insert = () => sql`
    insert into bookings (aspirant_user_id, mentor_user_id, duration_minutes, starts_at, ends_at, status,
      price_paise, platform_fee_paise, mentor_earnings_paise)
    values (${aspirant.id}, ${mentor.id}, 30, now() + interval '3 days', now() + interval '3 days 30 minutes',
      'confirmed', 29900, 5980, 23920)`;
  await insert();
  await expect(insert()).rejects.toThrow(/bookings_no_overlap/);
  void signIn;
});
