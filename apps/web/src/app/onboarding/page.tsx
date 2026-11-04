import type { Metadata } from "next";
import { asc, eq } from "@chayan/db";
import { exams } from "@chayan/db";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { getDb } from "@/lib/db";
import { getAspirantProfile, requireUser } from "@/lib/session";
import { allowedTargetYears } from "./schema";

export const metadata: Metadata = { title: "Set up your preparation", robots: { index: false } };

export default async function OnboardingPage() {
  const user = await requireUser("/onboarding");
  const profile = await getAspirantProfile(user.id);

  const examOptions = await getDb().query.exams.findMany({
    where: eq(exams.isActive, true),
    orderBy: asc(exams.sortOrder),
    columns: { id: true, shortName: true, nameHi: true },
    with: {
      stages: {
        columns: { id: true, name: true },
        orderBy: (stage, { asc }) => asc(stage.sortOrder),
      },
    },
  });

  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-extrabold sm:text-4xl">
        {profile ? "Update your preparation details" : `Welcome, ${firstName}`}
      </h1>
      <p className="text-ink-muted mt-3">
        {profile
          ? "We use these to suggest the right mentors for you."
          : "Tell us about your preparation so we can show you the right mentors. This takes under a minute."}
      </p>
      <div className="mt-10">
        <OnboardingForm
          exams={examOptions}
          targetYears={allowedTargetYears()}
          isFirstTime={!profile}
          initial={
            profile
              ? {
                  examId: profile.examId,
                  examStageId: profile.examStageId,
                  targetYear: String(profile.targetYear),
                  language: profile.language,
                  attemptNumber: String(profile.attemptNumber),
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
