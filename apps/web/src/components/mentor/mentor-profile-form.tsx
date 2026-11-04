"use client";

import { useActionState, useState } from "react";
import {
  FOCUS_AREA_LABELS,
  FOCUS_AREAS,
  PREP_LANGUAGE_LABELS,
  PREP_LANGUAGES,
  type FocusArea,
  type PrepLanguage,
} from "@chayan/shared";
import { saveMentorProfile, type FormState } from "@/app/mentor/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Values = {
  headline: string;
  bio: string;
  languages: PrepLanguage[];
  focusAreas: FocusArea[];
  stageCodes: string[];
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Chip({
  name,
  value,
  checked,
  onChange,
  children,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "bg-surface flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm",
        checked ? "border-pen ring-pen ring-1" : "border-line hover:border-ink-muted",
      )}
    >
      <input
        type="checkbox"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-pen size-4 shrink-0"
      />
      {children}
    </label>
  );
}

export function MentorProfileForm({
  stages,
  initial,
}: {
  stages: { code: string; name: string }[];
  initial: Values;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveMentorProfile, {});
  const [values, setValues] = useState<Values>(initial);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-8">
      {state.saved ? <FormMessage tone="success">Profile saved.</FormMessage> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <Field
        id="headline"
        label="Headline"
        hint={`One line aspirants read first, for example "Hindi-medium UPSC interview 2024, answer writing and optional strategy". ${values.headline.trim().length}/120`}
        error={errors.headline}
      >
        <Input
          id="headline"
          name="headline"
          maxLength={120}
          value={values.headline}
          onChange={(event) => setValues({ ...values, headline: event.target.value })}
          aria-invalid={Boolean(errors.headline)}
        />
      </Field>

      <Field
        id="bio"
        label="About you"
        hint={`${values.bio.trim().length}/800 characters, at least 80.`}
        error={errors.bio}
      >
        <textarea
          id="bio"
          name="bio"
          rows={7}
          maxLength={800}
          value={values.bio}
          onChange={(event) => setValues({ ...values, bio: event.target.value })}
          aria-invalid={Boolean(errors.bio)}
          className={cn(inputClassName, "h-auto py-2 leading-relaxed")}
        />
      </Field>

      <fieldset>
        <legend className="font-semibold">Stages you can help with</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {stages.map((stage) => (
            <Chip
              key={stage.code}
              name="stageCodes"
              value={stage.code}
              checked={values.stageCodes.includes(stage.code)}
              onChange={() =>
                setValues({ ...values, stageCodes: toggle(values.stageCodes, stage.code) })
              }
            >
              {stage.name}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-semibold">What you help with</legend>
        <p className="text-ink-muted mt-1 text-sm">Choose up to 6.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => (
            <Chip
              key={area}
              name="focusAreas"
              value={area}
              checked={values.focusAreas.includes(area)}
              onChange={() => setValues({ ...values, focusAreas: toggle(values.focusAreas, area) })}
            >
              {FOCUS_AREA_LABELS[area]}
            </Chip>
          ))}
        </div>
        {errors.focusAreas ? (
          <p className="text-omr mt-2 text-sm font-medium">{errors.focusAreas}</p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="font-semibold">Languages</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {PREP_LANGUAGES.map((language) => (
            <Chip
              key={language}
              name="languages"
              value={language}
              checked={values.languages.includes(language)}
              onChange={() =>
                setValues({ ...values, languages: toggle(values.languages, language) })
              }
            >
              {PREP_LANGUAGE_LABELS[language]}
            </Chip>
          ))}
        </div>
        {errors.languages ? (
          <p className="text-omr mt-2 text-sm font-medium">{errors.languages}</p>
        ) : null}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
