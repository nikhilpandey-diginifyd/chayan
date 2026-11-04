"use client";

import { useActionState, useState } from "react";
import {
  badgesForExamBody,
  INDIAN_STATES,
  MENTOR_BADGE_INFO,
  PREP_LANGUAGE_LABELS,
  PREP_LANGUAGES,
  type ExamBody,
  type MentorBadge,
  type PrepLanguage,
} from "@chayan/shared";
import { saveApplicationDetails, type DetailsState } from "@/app/mentor/apply/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export type DetailsValues = {
  phone: string;
  city: string;
  state: string;
  examId: string;
  claimedBadge: string;
  examYear: string;
  rank: string;
  rollNumber: string;
  languages: PrepLanguage[];
  bio: string;
  introVideoUrl: string;
  inGovernmentService: "" | "yes" | "no";
};

export const emptyDetails: DetailsValues = {
  phone: "",
  city: "",
  state: "",
  examId: "",
  claimedBadge: "",
  examYear: "",
  rank: "",
  rollNumber: "",
  languages: [],
  bio: "",
  introVideoUrl: "",
  inGovernmentService: "",
};

type ExamOption = { id: string; shortName: string; body: ExamBody };

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-omr mt-2 text-sm font-medium">
      {message}
    </p>
  );
}

export function ApplicationDetailsForm({
  exams,
  years,
  initial,
}: {
  exams: ExamOption[];
  years: number[];
  initial: DetailsValues;
}) {
  const [state, formAction, pending] = useActionState<DetailsState, FormData>(
    saveApplicationDetails,
    {},
  );
  const [values, setValues] = useState<DetailsValues>(initial);
  const [permission, setPermission] = useState(initial.inGovernmentService === "yes");
  const errors = state.errors ?? {};

  const exam = exams.find((option) => option.id === values.examId);
  const badgeOptions: MentorBadge[] = exam ? badgesForExamBody(exam.body) : [];

  function update<K extends keyof DetailsValues>(key: K, value: DetailsValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function toggleLanguage(language: PrepLanguage) {
    setValues((current) => ({
      ...current,
      languages: current.languages.includes(language)
        ? current.languages.filter((item) => item !== language)
        : [...current.languages, language],
    }));
  }

  return (
    <form action={formAction} className="space-y-8">
      {state.formError ? <FormMessage tone="error">{state.formError}</FormMessage> : null}
      {state.saved ? (
        <FormMessage tone="success">Details saved. Now upload your documents.</FormMessage>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          id="phone"
          label="Mobile number"
          hint="For our team only. Never shown to aspirants."
          error={errors.phone}
        >
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            aria-invalid={Boolean(errors.phone)}
          />
        </Field>
        <Field id="city" label="City" error={errors.city}>
          <Input
            id="city"
            name="city"
            autoComplete="address-level2"
            value={values.city}
            onChange={(event) => update("city", event.target.value)}
            aria-invalid={Boolean(errors.city)}
          />
        </Field>
        <Field id="state" label="State or union territory" error={errors.state}>
          <Select
            id="state"
            name="state"
            value={values.state}
            onChange={(event) => update("state", event.target.value)}
            aria-invalid={Boolean(errors.state)}
          >
            <option value="">Choose a state</option>
            {INDIAN_STATES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="border-line border-t pt-8">
        <h3 className="text-lg font-bold">Your result</h3>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <Field id="examId" label="Exam" error={errors.examId}>
            <Select
              id="examId"
              name="examId"
              value={values.examId}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  examId: event.target.value,
                  claimedBadge: "",
                }))
              }
              aria-invalid={Boolean(errors.examId)}
            >
              <option value="">Choose an exam</option>
              {exams.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.shortName}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="examYear" label="Exam year" error={errors.examYear}>
            <Select
              id="examYear"
              name="examYear"
              value={values.examYear}
              onChange={(event) => update("examYear", event.target.value)}
              aria-invalid={Boolean(errors.examYear)}
            >
              <option value="">Choose a year</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <fieldset
          className="mt-6"
          aria-describedby={errors.claimedBadge ? "claimedBadge-error" : undefined}
        >
          <legend className="font-semibold">What can you prove?</legend>
          {exam ? (
            <div className="mt-3 space-y-3">
              {badgeOptions.map((badge) => {
                const info = MENTOR_BADGE_INFO[badge];
                const checked = values.claimedBadge === badge;
                return (
                  <label
                    key={badge}
                    className={cn(
                      "bg-surface flex cursor-pointer gap-3 rounded-[var(--radius-control)] border px-4 py-3",
                      checked ? "border-pen ring-pen ring-1" : "border-line hover:border-ink-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="claimedBadge"
                      value={badge}
                      checked={checked}
                      onChange={() => update("claimedBadge", badge)}
                      className="accent-pen mt-1 size-4 shrink-0"
                    />
                    <span>
                      <span className="block font-semibold">{info.label}</span>
                      <span className="text-ink-muted block text-sm">{info.description}</span>
                      <span className="text-ink-muted mt-1 block text-sm">
                        Proof needed: {info.proof}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-ink-muted mt-2 text-sm">Choose an exam to see the options.</p>
          )}
          <ErrorText id="claimedBadge-error" message={errors.claimedBadge} />
        </fieldset>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Field
            id="rollNumber"
            label="Roll number"
            hint="We match it against the official result list."
            error={errors.rollNumber}
          >
            <Input
              id="rollNumber"
              name="rollNumber"
              autoComplete="off"
              value={values.rollNumber}
              onChange={(event) => update("rollNumber", event.target.value)}
              aria-invalid={Boolean(errors.rollNumber)}
            />
          </Field>
          <Field id="rank" label="Rank (optional)" hint="For example AIR 245." error={errors.rank}>
            <Input
              id="rank"
              name="rank"
              autoComplete="off"
              value={values.rank}
              onChange={(event) => update("rank", event.target.value)}
              aria-invalid={Boolean(errors.rank)}
            />
          </Field>
        </div>
      </div>

      <div className="border-line border-t pt-8">
        <h3 className="text-lg font-bold">How you&apos;ll mentor</h3>

        <fieldset
          className="mt-5"
          aria-describedby={errors.languages ? "languages-error" : undefined}
        >
          <legend className="font-semibold">Languages you can mentor in</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {PREP_LANGUAGES.map((language) => {
              const checked = values.languages.includes(language);
              return (
                <label
                  key={language}
                  className={cn(
                    "bg-surface flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2",
                    checked ? "border-pen ring-pen ring-1" : "border-line hover:border-ink-muted",
                  )}
                >
                  <input
                    type="checkbox"
                    name="languages"
                    value={language}
                    checked={checked}
                    onChange={() => toggleLanguage(language)}
                    className="accent-pen size-4 shrink-0"
                  />
                  {PREP_LANGUAGE_LABELS[language]}
                </label>
              );
            })}
          </div>
          <ErrorText id="languages-error" message={errors.languages} />
        </fieldset>

        <div className="mt-6">
          <Field
            id="bio"
            label="About you"
            hint={`How you prepared and what you can help aspirants with. ${values.bio.trim().length}/800 characters, at least 80.`}
            error={errors.bio}
          >
            <textarea
              id="bio"
              name="bio"
              rows={6}
              maxLength={800}
              value={values.bio}
              onChange={(event) => update("bio", event.target.value)}
              aria-invalid={Boolean(errors.bio)}
              className={cn(inputClassName, "h-auto py-2 leading-relaxed")}
            />
          </Field>
        </div>

        <div className="mt-6">
          <Field
            id="introVideoUrl"
            label="Intro video link (optional)"
            hint="A 1 to 2 minute unlisted YouTube or Google Drive video introducing yourself."
            error={errors.introVideoUrl}
          >
            <Input
              id="introVideoUrl"
              name="introVideoUrl"
              type="url"
              placeholder="https://"
              value={values.introVideoUrl}
              onChange={(event) => update("introVideoUrl", event.target.value)}
              aria-invalid={Boolean(errors.introVideoUrl)}
            />
          </Field>
        </div>

        <fieldset
          className="mt-6"
          aria-describedby={errors.inGovernmentService ? "inGovernmentService-error" : undefined}
        >
          <legend className="font-semibold">Are you currently in government service?</legend>
          <div className="mt-3 flex gap-6">
            {(["no", "yes"] as const).map((option) => (
              <label key={option} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="inGovernmentService"
                  value={option}
                  checked={values.inGovernmentService === option}
                  onChange={() => update("inGovernmentService", option)}
                  className="accent-pen size-4 shrink-0"
                />
                {option === "yes" ? "Yes" : "No"}
              </label>
            ))}
          </div>
          <ErrorText id="inGovernmentService-error" message={errors.inGovernmentService} />
          {values.inGovernmentService === "yes" ? (
            <div className="mt-4">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="servicePermission"
                  checked={permission}
                  onChange={(event) => setPermission(event.target.checked)}
                  className="accent-pen mt-1 size-4 shrink-0"
                />
                <span className="text-ink-muted">
                  I have any permission my service conduct rules require to take paid mentoring
                  sessions.
                </span>
              </label>
              <ErrorText id="servicePermission-error" message={errors.servicePermission} />
            </div>
          ) : null}
        </fieldset>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save details"}
      </Button>
    </form>
  );
}
