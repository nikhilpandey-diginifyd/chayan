"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, consents, eq, exams, inArray, mentorApplications, mentorDocuments } from "@chayan/db";
import { MENTOR_BADGE_INFO, PREP_LANGUAGES } from "@chayan/shared";
import { getDb } from "@/lib/db";
import { getStorage } from "@/lib/storage";
import {
  applicationDetailsSchema,
  EDITABLE_STATUSES,
  getMentorProfile,
  missingRequiredDocuments,
  type ApplicationFieldErrors,
} from "@/lib/mentor-applications";
import { notifyApplicationReceived } from "@/lib/notifications";
import { requireUser } from "@/lib/session";
import { siteConfig } from "@/config/site";
import { writeAuditLog } from "@/lib/audit";

export type DetailsState = { errors?: ApplicationFieldErrors; formError?: string; saved?: boolean };
export type SubmitState = { error?: string };

export async function saveApplicationDetails(
  _previous: DetailsState,
  formData: FormData,
): Promise<DetailsState> {
  const user = await requireUser("/mentor/apply");
  if (await getMentorProfile(user.id)) return { formError: "You are already a verified mentor." };

  const parsed = applicationDetailsSchema.safeParse({
    phone: formData.get("phone") ?? "",
    city: formData.get("city") ?? "",
    state: formData.get("state") ?? "",
    examId: formData.get("examId") ?? "",
    claimedBadge: formData.get("claimedBadge") ?? "",
    examYear: formData.get("examYear") ?? "",
    rank: formData.get("rank") ?? "",
    rollNumber: formData.get("rollNumber") ?? "",
    languages: formData
      .getAll("languages")
      .filter((value): value is string => typeof value === "string")
      .filter((value) => (PREP_LANGUAGES as readonly string[]).includes(value)),
    bio: formData.get("bio") ?? "",
    introVideoUrl: formData.get("introVideoUrl") ?? "",
    inGovernmentService: formData.get("inGovernmentService") ?? "",
    servicePermission: formData.get("servicePermission") ?? undefined,
  });

  const errors: ApplicationFieldErrors = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof ApplicationFieldErrors;
      errors[key] ??= issue.message;
    }
    return { errors };
  }

  const data = parsed.data;
  if (data.inGovernmentService === "yes" && data.servicePermission !== "on") {
    return {
      errors: {
        servicePermission:
          "Confirm you have the permission your service rules require for paid mentoring",
      },
    };
  }

  const db = getDb();
  const exam = await db.query.exams.findFirst({
    where: and(eq(exams.id, data.examId), eq(exams.isActive, true)),
    columns: { id: true, body: true },
  });
  if (!exam) return { errors: { examId: "Choose the exam you cleared" } };
  if (!MENTOR_BADGE_INFO[data.claimedBadge].bodies.includes(exam.body)) {
    return { errors: { claimedBadge: "This result type doesn't apply to the chosen exam" } };
  }

  const values = {
    phone: data.phone,
    city: data.city,
    state: data.state,
    examId: data.examId,
    claimedBadge: data.claimedBadge,
    examYear: data.examYear,
    rank: data.rank,
    rollNumber: data.rollNumber.toUpperCase(),
    languages: data.languages,
    bio: data.bio,
    introVideoUrl: data.introVideoUrl,
    inGovernmentService: data.inGovernmentService === "yes",
  };

  const existing = await db.query.mentorApplications.findFirst({
    where: eq(mentorApplications.userId, user.id),
    columns: { id: true, status: true },
  });

  if (existing && !EDITABLE_STATUSES.includes(existing.status)) {
    return { formError: "Your application is under review and can't be changed right now." };
  }

  if (existing) {
    await db.update(mentorApplications).set(values).where(eq(mentorApplications.id, existing.id));
  } else {
    await db.insert(mentorApplications).values({ userId: user.id, status: "draft", ...values });
  }

  revalidatePath("/mentor/apply");
  return { saved: true };
}

export async function deleteMentorDocument(formData: FormData): Promise<void> {
  const user = await requireUser("/mentor/apply");
  const documentId = String(formData.get("documentId") ?? "");
  const db = getDb();

  const [document] = await db
    .select({ id: mentorDocuments.id, storageKey: mentorDocuments.storageKey })
    .from(mentorDocuments)
    .innerJoin(mentorApplications, eq(mentorApplications.id, mentorDocuments.applicationId))
    .where(
      and(
        eq(mentorDocuments.id, documentId),
        eq(mentorApplications.userId, user.id),
        inArray(mentorApplications.status, [...EDITABLE_STATUSES]),
      ),
    )
    .limit(1);

  if (!document) return;

  await db.delete(mentorDocuments).where(eq(mentorDocuments.id, document.id));
  await getStorage().delete(document.storageKey);
  revalidatePath("/mentor/apply");
}

export async function submitMentorApplication(
  _previous: SubmitState,
  formData: FormData,
): Promise<SubmitState> {
  const user = await requireUser("/mentor/apply");

  if (formData.get("consent") !== "on") {
    return { error: "Confirm the declaration to submit your application." };
  }

  const db = getDb();
  const application = await db.query.mentorApplications.findFirst({
    where: eq(mentorApplications.userId, user.id),
    with: { documents: { columns: { kind: true } } },
  });

  if (!application) return { error: "Save your details first." };
  if (!EDITABLE_STATUSES.includes(application.status)) {
    return { error: "This application was already submitted." };
  }
  if (!application.examId || !application.claimedBadge || !application.bio) {
    return { error: "Save your details first." };
  }

  const missing = missingRequiredDocuments(application.documents.map((d) => d.kind));
  if (missing.length > 0) {
    return { error: "Upload all required documents before submitting." };
  }

  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    null;

  const updated = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(mentorApplications)
      .set({ status: "submitted", submittedAt: new Date(), reviewNote: null })
      .where(
        and(
          eq(mentorApplications.id, application.id),
          inArray(mentorApplications.status, [...EDITABLE_STATUSES]),
        ),
      )
      .returning({ id: mentorApplications.id });

    if (!row) return false;

    await tx.insert(consents).values({
      userId: user.id,
      purpose: "mentor_declaration",
      documentVersion: siteConfig.policyLastUpdated,
      ipAddress,
      userAgent: requestHeaders.get("user-agent"),
    });
    await writeAuditLog(tx, {
      actorUserId: user.id,
      action: "mentor_application.submitted",
      entityType: "mentor_application",
      entityId: application.id,
    });
    return true;
  });

  if (!updated) return { error: "This application was already submitted." };

  await notifyApplicationReceived({ name: user.name, email: user.email });
  revalidatePath("/mentor/apply");
  revalidatePath("/admin/mentors");
  return {};
}
