import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createAdmin, signIn, signUpAndVerify, unique, waitForEmail } from "./helpers";

const here = path.dirname(fileURLToPath(import.meta.url));

const pdf = path.join(here, ".tmp-result.pdf");
const png = path.join(here, ".tmp-id.png");
test.beforeAll(() => {
  writeFileSync(pdf, "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");
  // 1x1 PNG
  writeFileSync(
    png,
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    ),
  );
});

test("apply as a mentor, get reviewed and approved", async ({ browser }) => {
  const adminPage = await (await browser.newContext()).newPage();
  const adminEmail = await createAdmin(adminPage);

  const page = await (await browser.newContext()).newPage();
  const email = `${unique("applicant")}@example.com`;
  const name = `Anjali ${unique("V")}`;
  await page.goto("/");
  await page.getByRole("link", { name: "Apply as a mentor" }).click();
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fmentor%2Fapply/);
  await signUpAndVerify(page, { name, email, next: "/mentor/apply" });
  await expect(page).toHaveURL(/\/mentor\/apply$/);

  await page.fill("#phone", "9876543210");
  await page.fill("#city", "Prayagraj");
  await page.selectOption("#state", "Uttar Pradesh");
  await page.selectOption("#examId", { label: "UPSC CSE" });
  await page.getByText("Interview appeared", { exact: true }).click();
  await page.selectOption("#examYear", "2024");
  await page.fill("#rollNumber", "0812345");
  await page.getByLabel("Hindi").check();
  await page.fill(
    "#bio",
    "I cleared Prelims and Mains in Hindi medium and appeared for the 2024 interview. I help with answer writing.",
  );
  await page.getByLabel("No", { exact: true }).check();
  await page.getByRole("button", { name: "Save details" }).click();
  await expect(page.getByText("Details saved")).toBeVisible();

  const bad = page.waitForResponse("**/api/mentor/documents");
  await page.locator("#upload-result_proof").setInputFiles(png.replace(".png", ".txt"));
  expect((await bad).status()).toBeGreaterThanOrEqual(400);
  await page.locator("#upload-result_proof").setInputFiles(pdf);
  await page.locator("#upload-id_proof").setInputFiles(png);
  await expect(page.getByRole("button", { name: /Remove/ })).toHaveCount(2);
  await page.locator("input[name=consent]").check();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Under review").first()).toBeVisible();
  await waitForEmail(email, /We received your mentor application/);

  await signIn(adminPage, adminEmail, "/admin/mentors");
  await adminPage
    .getByRole("row", { name: new RegExp(name) })
    .getByRole("link", { name: "Review" })
    .click();
  await adminPage.getByRole("checkbox").check();
  await adminPage.getByRole("button", { name: "Approve application" }).click();
  await expect(adminPage.getByText("Application approved")).toBeVisible();
  await waitForEmail(email, /verified mentor/);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/mentor$/);
  await expect(page.getByText("Interview appeared")).toBeVisible();
});

test.beforeAll(() => {
  writeFileSync(png.replace(".png", ".txt"), "not an image");
});
