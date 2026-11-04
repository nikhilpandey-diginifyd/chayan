import "server-only";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { cache } from "react";
import {
  asc,
  eq,
  examStages,
  mentorAvailabilityRules,
  mentorBlockedDates,
  mentorProfiles,
  mentorServices,
} from "@chayan/db";
import { getDb } from "@/lib/db";
import { requireUser, type SessionUser } from "@/lib/session";

export function slugify(value: string): string {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "mentor"
  );
}

/** Gives the mentor a stable public URL the first time they open their dashboard. */
async function ensureSlug(userId: string, name: string): Promise<string> {
  const db = getDb();
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${slugify(name)}-${randomBytes(3).toString("hex").slice(0, 4)}`;
    const [row] = await db
      .update(mentorProfiles)
      .set({ slug: candidate })
      .where(eq(mentorProfiles.userId, userId))
      .returning({ slug: mentorProfiles.slug })
      .catch((error: unknown) => {
        // Unique violation: try another suffix
        if ((error as { code?: string }).code === "23505") return [];
        throw error;
      });
    if (row?.slug) return row.slug;
  }
  throw new Error("Could not create a profile link");
}

export const getMentorWorkspace = cache(async (userId: string) => {
  const db = getDb();
  const profile = await db.query.mentorProfiles.findFirst({
    where: eq(mentorProfiles.userId, userId),
    with: {
      exam: { columns: { id: true, shortName: true, body: true } },
      services: { orderBy: asc(mentorServices.durationMinutes) },
      availabilityRules: {
        orderBy: [asc(mentorAvailabilityRules.weekday), asc(mentorAvailabilityRules.startMinute)],
      },
      blockedDates: { orderBy: asc(mentorBlockedDates.date) },
    },
  });
  if (!profile) return null;

  const stages = await db
    .select({ code: examStages.code, name: examStages.name })
    .from(examStages)
    .where(eq(examStages.examId, profile.examId))
    .orderBy(asc(examStages.sortOrder));

  return { ...profile, stages };
});

export type MentorWorkspace = NonNullable<Awaited<ReturnType<typeof getMentorWorkspace>>>;

/** Signed-in user's mentor workspace, or a redirect to the application. */
export async function requireMentor(
  returnTo: string,
): Promise<{ user: SessionUser; mentor: MentorWorkspace }> {
  const user = await requireUser(returnTo);
  let mentor = await getMentorWorkspace(user.id);
  if (!mentor) redirect("/mentor/apply");
  if (!mentor.slug) {
    const slug = await ensureSlug(user.id, user.name);
    mentor = { ...mentor, slug };
  }
  return { user, mentor };
}

export type PublishCheck = { key: string; label: string; done: boolean; href: string };

export function publishChecklist(mentor: MentorWorkspace): PublishCheck[] {
  return [
    {
      key: "profile",
      label: "Write a headline for your profile",
      done: Boolean(mentor.headline),
      href: "/mentor/profile",
    },
    {
      key: "services",
      label: "Set a price for at least one session length",
      done: mentor.services.some((service) => service.isActive),
      href: "/mentor/sessions",
    },
    {
      key: "availability",
      label: "Add your weekly available hours",
      done: mentor.availabilityRules.length > 0,
      href: "/mentor/availability",
    },
  ];
}

export function canPublish(mentor: MentorWorkspace): boolean {
  return mentor.status === "active" && publishChecklist(mentor).every((item) => item.done);
}

export function photoUrl(photoKey: string | null): string | null {
  return photoKey ? `/api/${photoKey}` : null;
}
