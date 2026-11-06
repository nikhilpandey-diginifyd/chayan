import { expect, test } from "@playwright/test";
import {
  createAdmin,
  createAspirant,
  createPublishedMentor,
  db,
  insertBooking,
  signIn,
  waitForEmail,
} from "./helpers";

test("weekly payout: details, creation with TDS, mark paid", async ({ browser }) => {
  const adminPage = await (await browser.newContext({ acceptDownloads: true })).newPage();
  const adminEmail = await createAdmin(adminPage);
  const page = await (await browser.newContext()).newPage();
  const mentor = await createPublishedMentor(page);
  const aspirantPage = await (await browser.newContext()).newPage();
  const aspirant = await createAspirant(aspirantPage);

  const booking = await insertBooking({
    aspirantId: aspirant.id,
    mentorId: mentor.id,
    startOffsetMinutes: -9 * 24 * 60,
    status: "completed",
  });

  await page.goto("/mentor/earnings");
  await page.fill("#accountHolderName", "Meera Mentor");
  await page.fill("#accountNumber", "123456789012");
  await page.fill("#confirmAccountNumber", "123456789012");
  await page.fill("#ifsc", "SBIN0001234");
  await page.fill("#pan", "ABCDE1234F");
  await page.getByRole("button", { name: "Save payout details" }).click();
  await expect(page.getByText("Bank account ending 9012 (SBIN0001234)")).toBeVisible();
  const [account] =
    await db()`select account_number_enc from mentor_payout_accounts where mentor_user_id = ${mentor.id}`;
  expect(String(account!.account_number_enc)).not.toContain("123456789012");

  await signIn(adminPage, adminEmail, "/admin/payouts");
  await adminPage.getByRole("button", { name: "Create payouts" }).click();
  await expect(adminPage.getByText(/Created \d+ payout/)).toBeVisible();
  const [payout] = await db()`
    select p.id, p.net_paise, p.tds_paise from payouts p join payout_items i on i.payout_id = p.id
    where i.booking_id = ${booking}`;
  expect(payout).toMatchObject({ net_paise: 23920, tds_paise: 0 });

  await adminPage.goto(`/admin/payouts/${payout!.id}`);
  await expect(adminPage.getByText("123456789012")).toBeVisible();
  await adminPage.fill("input[name=reference]", "UTR00011122");
  await adminPage.getByRole("button", { name: "Mark paid" }).click();
  await expect(adminPage.getByText(/reference UTR00011122/)).toBeVisible();
  await waitForEmail(mentor.email, /Payout sent/);
});
