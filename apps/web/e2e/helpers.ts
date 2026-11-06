import { readFileSync, existsSync } from "node:fs";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import postgres from "postgres";
import { OUTBOX_FILE } from "../playwright.config";

export const PASSWORD = "e2e-password-1";

let client: postgres.Sql | null = null;
export function db() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set for e2e tests");
  client ??= postgres(process.env.DATABASE_URL, { max: 2, onnotice: () => {} });
  return client;
}

export function unique(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

type OutboxEmail = { to: string; subject: string; text: string };

function readOutbox(): OutboxEmail[] {
  if (!existsSync(OUTBOX_FILE)) return [];
  return readFileSync(OUTBOX_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as OutboxEmail);
}

/** Waits for an email to `to` whose subject matches, and returns the latest one. */
export async function waitForEmail(to: string, subject: RegExp): Promise<OutboxEmail> {
  let found: OutboxEmail | undefined;
  await expect
    .poll(
      () => {
        found = readOutbox()
          .filter(
            (email) => email.to.toLowerCase() === to.toLowerCase() && subject.test(email.subject),
          )
          .at(-1);
        return Boolean(found);
      },
      { message: `email to ${to} matching ${subject}` },
    )
    .toBe(true);
  return found!;
}

export function linkIn(email: OutboxEmail, pattern: RegExp): string {
  const url = email.text.match(/https?:\/\/\S+/g)?.find((candidate) => pattern.test(candidate));
  if (!url) throw new Error(`No link matching ${pattern} in "${email.subject}"`);
  return url;
}

export async function signUpAndVerify(
  page: Page,
  options: { name: string; email: string; next?: string },
) {
  await page.goto(options.next ? `/sign-up?next=${encodeURIComponent(options.next)}` : "/sign-up");
  await page.fill("#name", options.name);
  await page.fill("#email", options.email);
  await page.fill("#password", PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/verify-email\?/, { timeout: 45_000 });
  const email = await waitForEmail(options.email, /Confirm your email/);
  await page.goto(linkIn(email, /verify-email/));
}

export async function signIn(page: Page, email: string, next: string, password = PASSWORD) {
  await page.goto(`/sign-in?next=${encodeURIComponent(next)}`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Sign in" }).click();
  // The first visit to a page can be slow while the dev server compiles it.
  await expect(page).toHaveURL(new RegExp(`${next.replace(/[/?]/g, (c) => `\\${c}`)}($|[?#])`), {
    timeout: 45_000,
  });
}

export async function signOut(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
}

export async function userId(email: string): Promise<string> {
  const [row] = await db()`select id from users where email = ${email.toLowerCase()}`;
  if (!row) throw new Error(`No user ${email}`);
  return row.id as string;
}

/** A fresh, signed-out admin account. */
export async function createAdmin(page: Page) {
  const email = `${unique("admin")}@example.com`;
  await signUpAndVerify(page, { name: "Admin Tester", email });
  await db()`update users set role = 'admin' where email = ${email}`;
  await signOut(page);
  return email;
}

/** An aspirant who has finished onboarding, left signed in. */
export async function createAspirant(page: Page, name = "Asha Aspirant") {
  const email = `${unique("asp")}@example.com`;
  await signUpAndVerify(page, { name, email });
  await expect(page).toHaveURL(/\/onboarding/);
  const id = await userId(email);
  await db()`
    insert into aspirant_profiles (user_id, exam_id, exam_stage_id, target_year, language, attempt_number)
    select ${id}, e.id, s.id, 2027, 'hindi', 1
    from exams e join exam_stages s on s.exam_id = e.id
    where e.code = 'UPSC_CSE' and s.code = 'PRELIMS'`;
  return { email, id };
}

/**
 * A verified, published mentor who is free all day, every day, with 15/30/60
 * minute sessions at ₹199/₹299/₹499. Left signed in.
 */
export async function createPublishedMentor(page: Page, name = "Meera Mentor") {
  const email = `${unique("mentor")}@example.com`;
  await signUpAndVerify(page, { name, email });
  const id = await userId(email);
  const slug = unique("meera-");
  const sql = db();
  await sql`update users set role = 'mentor' where id = ${id}`;
  await sql`
    insert into mentor_profiles (user_id, exam_id, badge, exam_year, languages, bio, slug, headline,
      focus_areas, is_published, buffer_minutes, min_notice_hours, booking_window_days)
    select ${id}, id, 'interview_appeared', 2024, ${sql.array(["hindi", "english"])},
      'Cleared Mains twice and appeared for the interview. I help with answer writing and strategy for working aspirants.',
      ${slug}, 'UPSC interview 2024: answer writing and strategy', ${sql.array(["answer_writing"])},
      true, 0, 1, 14
    from exams where code = 'UPSC_CSE'`;
  for (const [duration, price] of [
    [15, 19900],
    [30, 29900],
    [60, 49900],
  ] as const) {
    await sql`insert into mentor_services (mentor_user_id, duration_minutes, price_paise) values (${id}, ${duration}, ${price})`;
  }
  for (let weekday = 0; weekday < 7; weekday++) {
    await sql`insert into mentor_availability_rules (mentor_user_id, weekday, start_minute, end_minute) values (${id}, ${weekday}, 0, 1440)`;
  }
  return { email, id, slug };
}

/** A paid, confirmed booking placed directly in the database. */
export async function insertBooking(options: {
  aspirantId: string;
  mentorId: string;
  startOffsetMinutes: number;
  durationMinutes?: number;
  status?: string;
  extra?: Record<string, string>;
}) {
  const sql = db();
  const duration = options.durationMinutes ?? 30;
  const [row] = await sql`
    insert into bookings (aspirant_user_id, mentor_user_id, duration_minutes, starts_at, ends_at, status,
      price_paise, platform_fee_paise, mentor_earnings_paise)
    values (${options.aspirantId}, ${options.mentorId}, ${duration},
      now() + make_interval(mins => ${options.startOffsetMinutes}),
      now() + make_interval(mins => ${options.startOffsetMinutes + duration}),
      ${options.status ?? "confirmed"}, 29900, 5980, 23920)
    returning id`;
  const id = row!.id as string;
  await sql`
    insert into payments (booking_id, provider, provider_order_id, provider_payment_id, amount_paise, status, captured_at)
    values (${id}, 'mock', ${`mock_order_${id}`}, ${`mock_pay_${id}`}, 29900, 'captured', now())`;
  for (const [column, value] of Object.entries(options.extra ?? {})) {
    await sql.unsafe(`update bookings set ${column} = ${value} where id = $1`, [id]);
  }
  return id;
}

/** Runs the once-a-minute scheduled work right now. */
export async function runScheduler(request: APIRequestContext) {
  await expect
    .poll(async () => {
      const response = await request.post("/api/cron/tick");
      return ((await response.json()) as { ran: boolean }).ran;
    })
    .toBe(true);
}
