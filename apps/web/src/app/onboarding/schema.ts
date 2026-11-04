import { z } from "zod";
import { MAX_ATTEMPT_NUMBER, PREP_LANGUAGES } from "@chayan/shared";

export function allowedTargetYears(now = new Date()): number[] {
  const year = now.getFullYear();
  return [year, year + 1, year + 2, year + 3];
}

export const onboardingSchema = z.object({
  examId: z.uuid("Choose your exam"),
  examStageId: z.uuid("Choose where you are in the exam"),
  targetYear: z.coerce
    .number<string>()
    .int()
    .refine((value) => allowedTargetYears().includes(value), "Choose your target year"),
  language: z.enum(PREP_LANGUAGES, "Choose a language"),
  attemptNumber: z.coerce
    .number<string>()
    .int()
    .min(1, "Choose your attempt")
    .max(MAX_ATTEMPT_NUMBER, "Choose your attempt"),
});

/** Consent is collected the first time only; later edits don't ask again. */
export const firstTimeOnboardingSchema = onboardingSchema.extend({
  consent: z.literal("on", "Confirm you are 18 or older and accept the terms to continue"),
});

export type OnboardingFieldErrors = Partial<
  Record<keyof z.input<typeof firstTimeOnboardingSchema>, string>
>;

export type OnboardingState = {
  errors?: OnboardingFieldErrors;
  formError?: string;
};
