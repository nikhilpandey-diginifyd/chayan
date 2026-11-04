"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { and, eq, mentorApplications, mentorProfiles, users } from "@chayan/db";
import { MENTOR_BADGE_INFO, MENTOR_BADGES } from "@chayan/shared";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";
import {
  notifyApplicationApproved,
  notifyApplicationRejected,
  notifyChangesRequested,
} from "@/lib/notifications";
import { requireRole } from "@/lib/session";

export type ReviewState = { error?: string };

const decisionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approve"),
    applicationId: z.uuid(),
    badge: z.enum(MENTOR_BADGES, "Choose the badge to grant"),
    checked: z.literal("on", "Confirm you checked the documents against the official result"),
    note: z.string().trim().max(1000).optional(),
  }),
  z.object({
    decision: z.enum(["request_changes", "reject"]),
    applicationId: z.uuid(),
    note: z
      .string()
      .trim()
      .min(10, "Explain what's wrong in at least 10 characters. The applicant sees this.")
      .max(1000),
  }),
]);

export async function reviewMentorApplication(
  _previous: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const admin = await requireRole(["admin"], "/admin/mentors");

  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  }
  const input = parsed.data;
  const db = getDb();

  const application = await db.query.mentorApplications.findFirst({
    where: eq(mentorApplications.id, input.applicationId),
    with: {
      user: { columns: { id: true, name: true, email: true, role: true } },
      exam: { columns: { body: true } },
    },
  });

  if (!application) return { error: "This application no longer exists." };
  if (application.status !== "submitted") {
    return { error: "Only applications under review can be decided. Refresh the page." };
  }
  if (application.userId === admin.id) {
    return { error: "You can't review your own application." };
  }

  const applicant = application.user;

  if (input.decision === "approve") {
    if (!application.examId || !application.examYear || !application.bio || !application.exam) {
      return { error: "The application is missing details and can't be approved." };
    }
    if (!MENTOR_BADGE_INFO[input.badge].bodies.includes(application.exam.body)) {
      return { error: "That badge doesn't apply to this exam." };
    }

    const examId = application.examId;
    const examYear = application.examYear;
    const bio = application.bio;

    const decided = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(mentorApplications)
        .set({
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: admin.id,
          reviewNote: input.note || null,
        })
        .where(
          and(
            eq(mentorApplications.id, application.id),
            eq(mentorApplications.status, "submitted"),
          ),
        )
        .returning({ id: mentorApplications.id });
      if (!row) return false;

      const profile = {
        examId,
        badge: input.badge,
        examYear,
        rank: application.rank,
        languages: application.languages,
        bio,
        status: "active" as const,
        approvedAt: new Date(),
        approvedBy: admin.id,
      };
      await tx
        .insert(mentorProfiles)
        .values({ userId: applicant.id, ...profile })
        .onConflictDoUpdate({ target: mentorProfiles.userId, set: profile });

      if (applicant.role === "aspirant") {
        await tx.update(users).set({ role: "mentor" }).where(eq(users.id, applicant.id));
      }

      await writeAuditLog(tx, {
        actorUserId: admin.id,
        action: "mentor_application.approved",
        entityType: "mentor_application",
        entityId: application.id,
        details: { badge: input.badge, claimedBadge: application.claimedBadge, note: input.note },
      });
      return true;
    });

    if (!decided)
      return { error: "Someone else already decided this application. Refresh the page." };
    await notifyApplicationApproved(applicant, input.badge);
  } else {
    const status = input.decision === "reject" ? "rejected" : "changes_requested";

    const decided = await db.transaction(async (tx) => {
      const [row] = await tx
        .update(mentorApplications)
        .set({ status, reviewedAt: new Date(), reviewedBy: admin.id, reviewNote: input.note })
        .where(
          and(
            eq(mentorApplications.id, application.id),
            eq(mentorApplications.status, "submitted"),
          ),
        )
        .returning({ id: mentorApplications.id });
      if (!row) return false;

      await writeAuditLog(tx, {
        actorUserId: admin.id,
        action: `mentor_application.${status}`,
        entityType: "mentor_application",
        entityId: application.id,
        details: { note: input.note },
      });
      return true;
    });

    if (!decided)
      return { error: "Someone else already decided this application. Refresh the page." };

    if (status === "rejected") await notifyApplicationRejected(applicant, input.note);
    else await notifyChangesRequested(applicant, input.note);
  }

  revalidatePath("/admin/mentors");
  revalidatePath("/admin");
  redirect(`/admin/mentors?status=submitted&done=${input.decision}`);
}

/** Pause or restore an approved mentor. Paused mentors disappear from the listing. */
export async function setMentorStatus(formData: FormData): Promise<void> {
  const admin = await requireRole(["admin"], "/admin/mentors");
  const applicationId = z.uuid().safeParse(formData.get("applicationId"));
  const status = z.enum(["active", "suspended"]).safeParse(formData.get("status"));
  if (!applicationId.success || !status.success) return;

  const db = getDb();
  const application = await db.query.mentorApplications.findFirst({
    where: eq(mentorApplications.id, applicationId.data),
    columns: { userId: true },
  });
  if (!application) return;

  await db.transaction(async (tx) => {
    const [row] = await tx
      .update(mentorProfiles)
      .set({ status: status.data })
      .where(eq(mentorProfiles.userId, application.userId))
      .returning({ slug: mentorProfiles.slug });
    if (!row) return;
    await writeAuditLog(tx, {
      actorUserId: admin.id,
      action: status.data === "suspended" ? "mentor.suspended" : "mentor.reactivated",
      entityType: "mentor_profile",
      entityId: application.userId,
    });
  });

  revalidatePath(`/admin/mentors/${applicationId.data}`);
  revalidatePath("/mentors");
}
