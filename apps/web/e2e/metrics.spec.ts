import { expect, test } from "./fixtures";
import {
  createAdmin,
  createAspirant,
  createPublishedMentor,
  insertBooking,
  signIn,
} from "./helpers";

test("admin metrics: daily and weekly counts from the database", async ({ browser }) => {
  const mentorPage = await (await browser.newContext()).newPage();
  const mentor = await createPublishedMentor(mentorPage);
  const aspirantPage = await (await browser.newContext()).newPage();
  const aspirant = await createAspirant(aspirantPage);
  // Two paid sessions from one aspirant today: the second is a repeat booking.
  for (const days of [-9, -8]) {
    await insertBooking({
      aspirantId: aspirant.id,
      mentorId: mentor.id,
      startOffsetMinutes: days * 24 * 60,
      status: "completed",
    });
  }

  // Non-admins can't tell the page exists.
  expect((await aspirantPage.goto("/admin/metrics"))!.status()).toBe(404);

  const adminPage = await (await browser.newContext()).newPage();
  const adminEmail = await createAdmin(adminPage);
  await signIn(adminPage, adminEmail, "/admin/metrics");
  await expect(adminPage.getByRole("heading", { name: "Metrics", level: 1 })).toBeVisible();
  await expect(adminPage.getByRole("heading", { name: "By day" })).toBeVisible();

  // Rows are newest first: row 0 is the header, row 1 is today.
  const today = adminPage.getByRole("row").nth(1);
  const cells = today.getByRole("cell");
  await expect(cells).toHaveCount(5);
  const [signups, , bookings, paid, repeat] = (await cells.allTextContents()).map(Number);
  expect(signups).toBeGreaterThanOrEqual(3);
  expect(bookings).toBeGreaterThanOrEqual(2);
  expect(paid).toBeGreaterThanOrEqual(2);
  expect(repeat).toBeGreaterThanOrEqual(1);
  await expect(adminPage.getByRole("row")).toHaveCount(1 + 14);

  await adminPage.getByRole("link", { name: "Weekly" }).click();
  await expect(adminPage).toHaveURL(/view=week/);
  await expect(adminPage.getByRole("heading", { name: "By week" })).toBeVisible();
  await expect(adminPage.getByRole("row")).toHaveCount(1 + 12);
  await expect(adminPage.getByRole("rowheader").first()).toHaveText(/^Week of /);
});
