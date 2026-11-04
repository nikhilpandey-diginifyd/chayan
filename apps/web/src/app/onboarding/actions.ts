"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "@chayan/db";
import { aspirantProfiles, consents, examStages, exams } from "@chayan/db";
import { siteConfig } from "@/config/site";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  firstTimeOnboardingSchema,
  onboardingSchema,
  type OnboardingFieldErrors,
  type OnboardingState,
} from "./schema";

export async function saveOnboarding(
  _previous: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const user = await requireUser("/onboarding");
  const db = getDb();

  const existing = await db.query.aspirantProfiles.findFirst({
    columns: { userId: true },
    where: eq(aspirantProfiles.userId, user.id),
  });
  const isFirstTime = !existing;

  const schema = isFirstTime ? firstTimeOnboardingSchema : onboardingSchema;
  const parsed = schema.safeParse({
    examId: formData.get("examId") ?? "",
    examStageId: formData.get("examStageId") ?? "",
    targetYear: formData.get("targetYear") ?? "",
    language: formData.get("language") ?? "",
    attemptNumber: formData.get("attemptNumber") ?? "",
    consent: formData.get("consent") ?? "",
  });

  if (!parsed.success) {
    const errors: OnboardingFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof OnboardingFieldErrors;
      errors[key] ??= issue.message;
    }
    return { errors };
  }

  const data = parsed.data;

  // The stage must belong to the chosen, active exam.
  const [stage] = await db
    .select({ id: examStages.id })
    .from(examStages)
    .innerJoin(exams, eq(exams.id, examStages.examId))
    .where(
      and(
        eq(examStages.id, data.examStageId),
        eq(examStages.examId, data.examId),
        eq(exams.isActive, true),
      ),
    )
    .limit(1);

  if (!stage) {
    return { errors: { examStageId: "Choose a stage for the selected exam" } };
  }

  const requestHeaders = await headers();
  const ipAddress =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    null;

  await db.transaction(async (tx) => {
    const values = {
      examId: data.examId,
      examStageId: data.examStageId,
      targetYear: data.targetYear,
      language: data.language,
      attemptNumber: data.attemptNumber,
    };

    await tx
      .insert(aspirantProfiles)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({ target: aspirantProfiles.userId, set: values });

    if (isFirstTime) {
      await tx.insert(consents).values({
        userId: user.id,
        purpose: "terms_privacy_age",
        documentVersion: siteConfig.policyLastUpdated,
        ipAddress,
        userAgent: requestHeaders.get("user-agent"),
      });
    }
  });

  redirect("/dashboard");
}
