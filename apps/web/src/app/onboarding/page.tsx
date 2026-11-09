import type { Metadata } from "next";
import { asc, eq } from "@chayan/db";
import { exams } from "@chayan/db";
import { PageHero } from "@/components/page/page-hero";
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
    <>
      <PageHero
        eyebrow={profile ? "Your preparation details" : "Step 1 of your journey"}
        title={profile ? "Update your preparation details" : `Welcome, ${firstName}`}
        lines={profile ? undefined : ["Kaunsa exam?", "Kaunsa stage?", "Kis language mein?"]}
        description={
          profile
            ? "We use these to suggest the right mentors for you."
            : "Tell us about your preparation so we can show you the right mentors. This takes under a minute."
        }
      />
      <div className="relative mx-auto -mt-8 max-w-2xl px-4 pb-16 sm:px-6">
        <div className="panel border-line bg-surface rounded-[var(--radius-panel)] border p-5 shadow-[var(--shadow-raised)] sm:p-8">
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
    </>
  );
}
