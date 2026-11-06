import { expect, test } from "@playwright/test";
import {
  linkIn,
  PASSWORD,
  signIn,
  signOut,
  signUpAndVerify,
  unique,
  waitForEmail,
} from "./helpers";

test("sign up, confirm email, onboard and reach the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fdashboard/);

  const email = `${unique("signup")}@example.com`;
  await signUpAndVerify(page, { name: "Ravi Kumar", email });
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Choose your exam")).toBeVisible();

  await page.getByText("UPSC CSE").click();
  await page.selectOption("#examStageId", { label: "Preparing for Mains" });
  await page.selectOption("#targetYear", { index: 1 });
  await page.selectOption("#attemptNumber", "2");
  await page.getByLabel("Hinglish").check();
  await page.locator("input[name=consent]").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Namaste, Ravi" })).toBeVisible();
});

test("wrong password, password reset, and links can't be reused", async ({ page }) => {
  const email = `${unique("reset")}@example.com`;
  await signUpAndVerify(page, { name: "Reset Tester", email });
  await signOut(page);

  await page.goto("/sign-in");
  await page.fill("#email", email);
  await page.fill("#password", "not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "don't match" })).toBeVisible();

  await page.goto("/forgot-password");
  await page.fill("#email", email);
  await page.getByRole("button", { name: "Send reset link" }).click();
  await expect(page.getByText("If an account exists")).toBeVisible();
  const reset = linkIn(await waitForEmail(email, /Reset your/), /reset-password/);
  await page.goto(reset);
  await page.fill("#password", "new-password-2");
  await page.fill("#confirm", "new-password-2");
  await page.getByRole("button", { name: "Save new password" }).click();
  await expect(page.getByText("Password changed")).toBeVisible();

  await page.goto(reset);
  await expect(page.getByText("expired or was already used")).toBeVisible();
  await signIn(page, email, "/onboarding", "new-password-2");
});

test("signing up with an existing email emails the owner instead of revealing it", async ({
  page,
}) => {
  const email = `${unique("exists")}@example.com`;
  await signUpAndVerify(page, { name: "Existing Person", email });
  await signOut(page);

  await page.goto("/sign-up");
  await page.fill("#name", "Someone Else");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email\?/);
  await expect(page.getByRole("link", { name: "reset your password" })).toBeVisible();
  await waitForEmail(email, /You already have a/);
});

test("redirects after sign-in never leave the site", async ({ page }) => {
  const email = `${unique("redirect")}@example.com`;
  await signUpAndVerify(page, { name: "Redirect Tester", email });
  await signOut(page);
  await page.goto("/sign-in?next=https://evil.example.com");
  await page.fill("#email", email);
  await page.fill("#password", PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/localhost:3000\//);
});
