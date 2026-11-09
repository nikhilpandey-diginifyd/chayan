import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

const here = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.join(here, ".env.local"), quiet: true });

export const OUTBOX_FILE = path.join(here, "e2e", ".outbox.jsonl");

/**
 * End-to-end tests. They start their own dev server with the scheduler off
 * (tests trigger it on demand) and emails written to e2e/.outbox.jsonl.
 * Stop any running `pnpm dev` first. Run with: pnpm --filter @chayan/web e2e
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000/api/health",
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DISABLE_SCHEDULER: "1",
      EMAIL_LOG_FILE: OUTBOX_FILE,
      RESEND_API_KEY: "",
      RAZORPAY_KEY_ID: "",
      RAZORPAY_KEY_SECRET: "",
      HMS_ACCESS_KEY: "",
      HMS_SECRET: "",
      HMS_TEMPLATE_ID: "",
      HMS_WEBHOOK_SECRET: "",
    },
  },
});
