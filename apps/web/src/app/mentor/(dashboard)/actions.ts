"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  and,
  eq,
  mentorAvailabilityRules,
  mentorBlockedDates,
  mentorProfiles,
  mentorServices,
} from "@chayan/db";
import {
  BOOKING_WINDOW_OPTIONS,
  BUFFER_OPTIONS,
  FOCUS_AREAS,
  istDateKey,
  MIN_NOTICE_OPTIONS,
  PREP_LANGUAGES,
  SESSION_DURATIONS,
  SESSION_PRICE_LIMITS,
  validateRules,
} from "@chayan/shared";
import { getDb } from "@/lib/db";
import { canPublish, getMentorWorkspace, requireMentor } from "@/lib/mentor-profile";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; saved?: boolean };

function refreshMentorPages(slug: string | null) {
  revalidatePath("/mentor", "layout");
  revalidatePath("/mentors");
  if (slug) revalidatePath(`/mentors/${slug}`);
}

function firstErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

/* ---------- Profile ---------- */

const profileSchema = z.object({
  headline: z
    .string()
    .trim()
    .min(20, "Write at least 20 characters")
    .max(120, "Use 120 characters or fewer"),
  bio: z
    .string()
    .trim()
    .min(80, "Write at least 80 characters")
    .max(800, "Use 800 characters or fewer"),
  languages: z.array(z.enum(PREP_LANGUAGES)).min(1, "Choose at least one language"),
  focusAreas: z.array(z.enum(FOCUS_AREAS)).max(6, "Choose up to 6"),
  stageCodes: z.array(z.string()).max(10),
});

export async function saveMentorProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const { mentor } = await requireMentor("/mentor/profile");

  const parsed = profileSchema.safeParse({
    headline: formData.get("headline") ?? "",
    bio: formData.get("bio") ?? "",
    languages: formData.getAll("languages"),
    focusAreas: formData.getAll("focusAreas"),
    stageCodes: formData.getAll("stageCodes"),
  });
  if (!parsed.success) return { fieldErrors: firstErrors(parsed.error) };

  const validStages = new Set(mentor.stages.map((stage) => stage.code));
  const stageCodes = parsed.data.stageCodes.filter((code) => validStages.has(code));

  await getDb()
    .update(mentorProfiles)
    .set({
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      languages: parsed.data.languages,
      focusAreas: parsed.data.focusAreas,
      stageCodes,
    })
    .where(eq(mentorProfiles.userId, mentor.userId));

  refreshMentorPages(mentor.slug);
  return { saved: true };
}

/* ---------- Sessions and prices ---------- */

export async function saveMentorServices(_prev: FormState, formData: FormData): Promise<FormState> {
  const { mentor } = await requireMentor("/mentor/sessions");
  const fieldErrors: Record<string, string> = {};
  const rows: { durationMinutes: number; pricePaise: number; isActive: boolean }[] = [];

  for (const duration of SESSION_DURATIONS) {
    const enabled = formData.get(`enabled_${duration}`) === "on";
    const raw = String(formData.get(`price_${duration}`) ?? "").trim();
    const existing = mentor.services.find((service) => service.durationMinutes === duration);

    if (!enabled) {
      if (existing)
        rows.push({ durationMinutes: duration, pricePaise: existing.pricePaise, isActive: false });
      continue;
    }

    const rupees = Number(raw);
    if (
      !raw ||
      !Number.isInteger(rupees) ||
      rupees < SESSION_PRICE_LIMITS.minRupees ||
      rupees > SESSION_PRICE_LIMITS.maxRupees
    ) {
      fieldErrors[`price_${duration}`] =
        `Enter a whole amount between ₹${SESSION_PRICE_LIMITS.minRupees} and ₹${SESSION_PRICE_LIMITS.maxRupees.toLocaleString("en-IN")}`;
      continue;
    }
    rows.push({ durationMinutes: duration, pricePaise: rupees * 100, isActive: true });
  }

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };
  if (!rows.some((row) => row.isActive)) {
    return { error: "Offer at least one session length." };
  }

  const db = getDb();
  await db.transaction(async (tx) => {
    for (const row of rows) {
      await tx
        .insert(mentorServices)
        .values({ mentorUserId: mentor.userId, ...row })
        .onConflictDoUpdate({
          target: [mentorServices.mentorUserId, mentorServices.durationMinutes],
          set: { pricePaise: row.pricePaise, isActive: row.isActive },
        });
    }
  });

  refreshMentorPages(mentor.slug);
  return { saved: true };
}

/* ---------- Availability ---------- */

const ruleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMinute: z.number().int().min(0).max(1440),
  endMinute: z.number().int().min(0).max(1440),
});

const availabilitySchema = z.object({
  rules: z.array(ruleSchema).max(7 * 6, "Use up to 6 time ranges per day"),
  blockedDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .max(90, "You can block up to 90 dates"),
  bufferMinutes: z.coerce
    .number<string>()
    .refine((value) => (BUFFER_OPTIONS as readonly number[]).includes(value), "Choose a break"),
  minNoticeHours: z.coerce
    .number<string>()
    .refine(
      (value) => (MIN_NOTICE_OPTIONS as readonly number[]).includes(value),
      "Choose a notice period",
    ),
  bookingWindowDays: z.coerce
    .number<string>()
    .refine(
      (value) => (BOOKING_WINDOW_OPTIONS as readonly number[]).includes(value),
      "Choose how far ahead",
    ),
});

export async function saveMentorAvailability(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const { mentor } = await requireMentor("/mentor/availability");

  let rules: unknown;
  let blockedDates: unknown;
  try {
    rules = JSON.parse(String(formData.get("rules") ?? "[]"));
    blockedDates = JSON.parse(String(formData.get("blockedDates") ?? "[]"));
  } catch {
    return { error: "Something went wrong reading your schedule. Refresh and try again." };
  }

  const parsed = availabilitySchema.safeParse({
    rules,
    blockedDates,
    bufferMinutes: formData.get("bufferMinutes") ?? "",
    minNoticeHours: formData.get("minNoticeHours") ?? "",
    bookingWindowDays: formData.get("bookingWindowDays") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your schedule and try again." };
  }

  const problems = validateRules(parsed.data.rules);
  if (problems.length > 0) return { error: problems[0] };

  if (parsed.data.rules.length === 0 && mentor.isPublished) {
    return {
      error: "Your profile is live. Unpublish it first if you want to remove all your hours.",
    };
  }

  const today = istDateKey(new Date());
  const futureBlocked = [...new Set(parsed.data.blockedDates)].filter((date) => date >= today);

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .delete(mentorAvailabilityRules)
      .where(eq(mentorAvailabilityRules.mentorUserId, mentor.userId));
    if (parsed.data.rules.length > 0) {
      await tx
        .insert(mentorAvailabilityRules)
        .values(parsed.data.rules.map((rule) => ({ mentorUserId: mentor.userId, ...rule })));
    }
    await tx.delete(mentorBlockedDates).where(eq(mentorBlockedDates.mentorUserId, mentor.userId));
    if (futureBlocked.length > 0) {
      await tx
        .insert(mentorBlockedDates)
        .values(futureBlocked.map((date) => ({ mentorUserId: mentor.userId, date })));
    }
    await tx
      .update(mentorProfiles)
      .set({
        bufferMinutes: parsed.data.bufferMinutes,
        minNoticeHours: parsed.data.minNoticeHours,
        bookingWindowDays: parsed.data.bookingWindowDays,
      })
      .where(eq(mentorProfiles.userId, mentor.userId));
  });

  refreshMentorPages(mentor.slug);
  return { saved: true };
}

/* ---------- Publish ---------- */

export async function setProfilePublished(formData: FormData): Promise<void> {
  const { user } = await requireMentor("/mentor");
  const publish = formData.get("publish") === "true";

  // Read fresh data: the cached workspace may predate edits in this request.
  const mentor = await getMentorWorkspace(user.id);
  if (!mentor) return;
  if (publish && !canPublish(mentor)) return;

  await getDb()
    .update(mentorProfiles)
    .set({ isPublished: publish })
    .where(and(eq(mentorProfiles.userId, user.id)));

  refreshMentorPages(mentor.slug);
}
