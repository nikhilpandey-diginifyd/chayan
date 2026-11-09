import path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createAdmin, createAspirant, db, signIn, signOut } from "./helpers";

const here = path.dirname(fileURLToPath(import.meta.url));

const pdf = path.join(here, ".tmp-paper.pdf");
test.beforeAll(() =>
  writeFileSync(pdf, "%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n"),
);

test("papers: admin upload, public page, sign-in to download", async ({ browser }) => {
  const adminPage = await (await browser.newContext()).newPage();
  const adminEmail = await createAdmin(adminPage);
  await signIn(adminPage, adminEmail, "/admin/papers");
  const title = `GS Paper ${Date.now()}`;
  await adminPage.selectOption("#examId", { label: "SSC CGL" });
  await adminPage.fill("#year", "2024");
  await adminPage.fill("#title", title);
  await adminPage.locator("#file").setInputFiles(pdf);
  await adminPage.getByRole("button", { name: "Add paper" }).click();
  await expect(adminPage.getByText("Paper added and live.")).toBeVisible({ timeout: 45_000 });
  const [paper] = await db()`select id, slug from pyq_papers where title = ${title}`;

  const visitor = await (await browser.newContext({ acceptDownloads: true })).newPage();
  await visitor.goto(`/papers/${paper!.slug}`);
  await expect(visitor.getByRole("link", { name: "Create a free account" })).toBeVisible();
  const redirect = await visitor.request.get(`/api/papers/${paper!.id}/download`, {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(303);

  await createAspirant(visitor);
  await visitor.goto(`/papers/${paper!.slug}`);
  const download = visitor.waitForEvent("download");
  await visitor.getByRole("link", { name: "Download question paper" }).click();
  expect((await download).suggestedFilename()).toBe(`${paper!.slug}.pdf`);
  void signOut;
});

test("videos: admin adds a YouTube link; signed-in viewers watch it in the privacy-friendly player", async ({
  browser,
}) => {
  const adminPage = await (await browser.newContext()).newPage();
  const adminEmail = await createAdmin(adminPage);
  await signIn(adminPage, adminEmail, "/admin/videos");
  const title = `Polity in 3 minutes ${Date.now()}`;
  await adminPage.fill("#url", "https://vimeo.com/1");
  await adminPage.fill("#title", title);
  await adminPage.getByRole("button", { name: "Add video" }).click();
  await expect(adminPage.getByText("doesn't look like a YouTube video link")).toBeVisible();
  await expect(adminPage.locator("#title")).toHaveValue(title);
  await adminPage.fill("#url", "https://youtu.be/dQw4w9WgXcQ");
  await adminPage.getByRole("button", { name: "Add video" }).click();
  await expect(adminPage.getByText("Video added and live.")).toBeVisible();

  const [video] = await db()`select slug from prep_videos where title = ${title}`;
  const visitor = await (await browser.newContext()).newPage();
  await visitor.goto(`/videos/${video!.slug}`);
  await expect(visitor.getByText("Sign in to watch")).toBeVisible();
  await expect(visitor.locator("iframe")).toHaveCount(0);

  await createAspirant(visitor, "Video Watcher");
  await visitor.goto(`/videos/${video!.slug}`);
  await expect(visitor.locator("iframe")).toHaveAttribute(
    "src",
    /^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/,
  );
});
