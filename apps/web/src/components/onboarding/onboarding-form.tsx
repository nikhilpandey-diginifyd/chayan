"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MAX_ATTEMPT_NUMBER, PREP_LANGUAGE_LABELS, PREP_LANGUAGES } from "@chayan/shared";
import { saveOnboarding } from "@/app/onboarding/actions";
import type { OnboardingState } from "@/app/onboarding/schema";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Select } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type ExamOption = {
  id: string;
  shortName: string;
  nameHi: string;
  stages: { id: string; name: string }[];
};

type Values = {
  examId: string;
  examStageId: string;
  targetYear: string;
  language: string;
  attemptNumber: string;
};

const emptyValues: Values = {
  examId: "",
  examStageId: "",
  targetYear: "",
  language: "",
  attemptNumber: "",
};

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-omr mt-2 text-sm font-medium">
      {message}
    </p>
  );
}

export function OnboardingForm({
  exams,
  targetYears,
  isFirstTime,
  initial,
}: {
  exams: ExamOption[];
  targetYears: number[];
  isFirstTime: boolean;
  initial?: Values;
}) {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    saveOnboarding,
    {},
  );
  const [values, setValues] = useState<Values>(initial ?? emptyValues);
  const [consent, setConsent] = useState(false);
  const errors = state.errors ?? {};

  const selectedExam = exams.find((exam) => exam.id === values.examId);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form action={formAction} className="space-y-10">
      {state.formError ? <FormMessage tone="error">{state.formError}</FormMessage> : null}

      <fieldset aria-describedby={errors.examId ? "examId-error" : undefined}>
        <legend className="font-display text-xl font-bold">
          Which exam are you preparing for?
        </legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {exams.map((exam) => {
            const checked = values.examId === exam.id;
            return (
              <label
                key={exam.id}
                className={cn(
                  "bg-surface flex cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border px-4 py-3 transition-colors",
                  checked ? "border-pen ring-pen ring-1" : "border-line hover:border-ink-muted",
                )}
              >
                <input
                  type="radio"
                  name="examId"
                  value={exam.id}
                  checked={checked}
                  onChange={() => {
                    setValues((current) => ({ ...current, examId: exam.id, examStageId: "" }));
                  }}
                  className="accent-pen size-4 shrink-0"
                />
                <span>
                  <span className="block font-semibold">{exam.shortName}</span>
                  <span className="text-ink-muted block text-sm" lang="hi">
                    {exam.nameHi}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <ErrorText id="examId-error" message={errors.examId} />
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field id="examStageId" label="Where are you now?" error={errors.examStageId}>
          <Select
            id="examStageId"
            name="examStageId"
            value={values.examStageId}
            onChange={(event) => update("examStageId", event.target.value)}
            disabled={!selectedExam}
            aria-invalid={Boolean(errors.examStageId)}
          >
            <option value="">{selectedExam ? "Choose a stage" : "Choose an exam first"}</option>
            {selectedExam?.stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                Preparing for {stage.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="targetYear" label="Target exam year" error={errors.targetYear}>
          <Select
            id="targetYear"
            name="targetYear"
            value={values.targetYear}
            onChange={(event) => update("targetYear", event.target.value)}
            aria-invalid={Boolean(errors.targetYear)}
          >
            <option value="">Choose a year</option>
            {targetYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="attemptNumber" label="Which attempt is this?" error={errors.attemptNumber}>
          <Select
            id="attemptNumber"
            name="attemptNumber"
            value={values.attemptNumber}
            onChange={(event) => update("attemptNumber", event.target.value)}
            aria-invalid={Boolean(errors.attemptNumber)}
          >
            <option value="">Choose your attempt</option>
            {Array.from({ length: MAX_ATTEMPT_NUMBER }, (_, index) => index + 1).map((n) => (
              <option key={n} value={n}>
                {n === 1
                  ? "First attempt"
                  : n === MAX_ATTEMPT_NUMBER
                    ? `${n} or more`
                    : `Attempt ${n}`}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <fieldset aria-describedby={errors.language ? "language-error" : undefined}>
        <legend className="font-semibold">Preferred language for sessions</legend>
        <div className="mt-3 flex flex-wrap gap-3">
          {PREP_LANGUAGES.map((language) => {
            const checked = values.language === language;
            return (
              <label
                key={language}
                className={cn(
                  "bg-surface flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2",
                  checked ? "border-pen ring-pen ring-1" : "border-line hover:border-ink-muted",
                )}
              >
                <input
                  type="radio"
                  name="language"
                  value={language}
                  checked={checked}
                  onChange={() => update("language", language)}
                  className="accent-pen size-4 shrink-0"
                />
                {PREP_LANGUAGE_LABELS[language]}
              </label>
            );
          })}
        </div>
        <ErrorText id="language-error" message={errors.language} />
      </fieldset>

      {isFirstTime ? (
        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="consent"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              className="accent-pen mt-1 size-4 shrink-0"
              aria-describedby={errors.consent ? "consent-error" : undefined}
            />
            <span className="text-ink-muted">
              I am 18 or older and I agree to the{" "}
              <Link href="/terms" target="_blank" className="text-pen underline underline-offset-2">
                terms of service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-pen underline underline-offset-2"
              >
                privacy policy
              </Link>
              .
            </span>
          </label>
          <ErrorText id="consent-error" message={errors.consent} />
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : isFirstTime ? "Continue" : "Save changes"}
      </Button>
    </form>
  );
}
