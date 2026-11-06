import { expect, test } from "@playwright/test";
import {
  createAspirant,
  createPublishedMentor,
  db,
  insertBooking,
  runScheduler,
  signIn,
  signOut,
  waitForEmail,
} from "./helpers";

test("join window, test call attendance and shared files", async ({ browser }) => {
  const context = await browser.newContext({ permissions: ["camera", "microphone"] });
  const mentorPage = await context.newPage();
  const mentor = await createPublishedMentor(mentorPage);
  const aspirantContext = await browser.newContext({ permissions: ["camera", "microphone"] });
  const page = await aspirantContext.newPage();
  const aspirant = await createAspirant(page);

  const later = await insertBooking({
    aspirantId: aspirant.id,
    mentorId: mentor.id,
    startOffsetMinutes: 180,
  });
  await page.goto(`/bookings/${later}`);
  await expect(
    page.getByText("The join button appears here 10 minutes before the start"),
  ).toBeVisible();
  expect((await page.request.post(`/api/sessions/${later}/join`)).status()).toBe(409);

  const live = await insertBooking({
    aspirantId: aspirant.id,
    mentorId: mentor.id,
    startOffsetMinutes: 5,
  });
  await page.goto(`/bookings/${live}`);
  await page.getByRole("link", { name: "Join the call" }).click();
  await page.getByLabel("Camera on").uncheck();
  await page.getByRole("button", { name: "Join call" }).click();
  await expect(page.getByText("Test call.")).toBeVisible();
  const [row] =
    await db()`select aspirant_first_joined_at is not null as joined from bookings where id = ${live}`;
  expect(row!.joined).toBe(true);

  await page.locator("#session-file").setInputFiles({
    name: "answer.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(page.getByRole("link", { name: /answer\.png/ })).toBeVisible();

  await mentorPage.goto(`/bookings/${live}/call`);
  await mentorPage.getByRole("button", { name: "Join call" }).click();
  await expect(mentorPage.getByRole("link", { name: /answer\.png/ })).toBeVisible();
});

test("no-shows are refunded by the scheduler; completed sessions get notes and reviews", async ({
  browser,
  request,
}) => {
  const mentorPage = await (await browser.newContext()).newPage();
  const mentor = await createPublishedMentor(mentorPage);
  const page = await (await browser.newContext()).newPage();
  const aspirant = await createAspirant(page);

  const mentorMissed = await insertBooking({
    aspirantId: aspirant.id,
    mentorId: mentor.id,
    startOffsetMinutes: -12,
    durationMinutes: 15,
  });
  const aspirantMissed = await insertBooking({
    aspirantId: aspirant.id,
    mentorId: mentor.id,
    startOffsetMinutes: -60,
    extra: { mentor_first_joined_at: "now() - interval '60 minutes'" },
  });
  const completed = await insertBooking({
    aspirantId: aspirant.id,
    mentorId: mentor.id,
    startOffsetMinutes: -120,
    extra: {
      mentor_first_joined_at: "now() - interval '120 minutes'",
      aspirant_first_joined_at: "now() - interval '119 minutes'",
    },
  });

  await runScheduler(request);
  const statuses = await db()`
    select b.id, b.status, coalesce((select sum(r.amount_paise) from refunds r join payments p on p.id = r.payment_id where p.booking_id = b.id), 0)::int as refunded
    from bookings b where b.id in (${mentorMissed}, ${aspirantMissed}, ${completed})`;
  const byId = Object.fromEntries(statuses.map((s) => [s.id as string, s]));
  expect(byId[mentorMissed]).toMatchObject({ status: "no_show_mentor", refunded: 29900 });
  expect(byId[aspirantMissed]).toMatchObject({ status: "no_show_aspirant", refunded: 14950 });
  expect(byId[completed]).toMatchObject({ status: "completed", refunded: 0 });
  await waitForEmail(aspirant.email, /didn't join\. Full refund issued/);
  await waitForEmail(aspirant.email, /How was your session/);

  await mentorPage.goto(`/bookings/${completed}#notes`);
  await mentorPage.fill("#sessionSummary", "Reviewed GS2 answers.");
  await mentorPage.fill("#nextSteps", "Two answers a day.");
  await mentorPage.getByRole("button", { name: "Save notes" }).click();
  await expect(mentorPage.getByRole("button", { name: "Edit notes" })).toBeVisible();

  await page.goto(`/bookings/${completed}`);
  await expect(page.getByText("Two answers a day.")).toBeVisible();
  await page.getByRole("radio", { name: "4 stars" }).click();
  await page.getByLabel("Clear strategy").check();
  await page.getByRole("button", { name: "Submit review" }).click();
  await expect(page.getByRole("button", { name: "Edit review" })).toBeVisible();

  await signOut(page);
  await page.goto(`/mentors/${mentor.slug}`);
  await expect(page.getByText("4.0").first()).toBeVisible();
  void signIn;
});
