"use client";

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { CheckCircle2, Pencil } from "lucide-react";
import {
  formatRank,
  MENTOR_BADGE_INFO,
  PREP_LANGUAGE_LABELS,
  type MentorBadge,
} from "@chayan/shared";
import {
  ApplicationDetailsForm,
  type DetailsValues,
  type ExamOption,
} from "@/components/mentor/application-details-form";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";

const ease = [0.22, 1, 0.36, 1] as const;

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-ink-muted text-xs font-semibold">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

/**
 * "Your details" on the mentor application. Once saved, the form folds into a
 * compact summary card and the page moves on to Documents; "Edit details"
 * opens the form again.
 */
export function ApplicationDetailsSection({
  exams,
  years,
  initial,
  hasSaved,
}: {
  exams: ExamOption[];
  years: number[];
  initial: DetailsValues;
  hasSaved: boolean;
}) {
  const [editing, setEditing] = useState(!hasSaved);
  const [justSaved, setJustSaved] = useState(false);
  const exam = exams.find((option) => option.id === initial.examId);
  const badge = initial.claimedBadge
    ? MENTOR_BADGE_INFO[initial.claimedBadge as MentorBadge]?.label
    : null;

  function handleSaved() {
    setJustSaved(true);
    setEditing(false);
    // Bring the next step into view once the page has updated.
    setTimeout(() => {
      document.getElementById("documents")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 450);
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {editing ? (
        <m.div
          key="form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease }}
          className="overflow-hidden"
        >
          <ApplicationDetailsForm
            key={JSON.stringify(initial)}
            exams={exams}
            years={years}
            initial={initial}
            onSaved={handleSaved}
            onCancel={hasSaved ? () => setEditing(false) : undefined}
          />
        </m.div>
      ) : (
        <m.div
          key="summary"
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease }}
          className="space-y-4"
        >
          {justSaved ? (
            <FormMessage tone="success">Details saved. Now upload your documents.</FormMessage>
          ) : null}
          <div className="border-seal/25 rounded-2xl border bg-gradient-to-br from-[#e5f6ee] to-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="text-seal flex items-center gap-2 font-bold">
                <CheckCircle2 aria-hidden="true" className="size-5" />
                Saved and ready for review
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setJustSaved(false);
                  setEditing(true);
                }}
              >
                <Pencil aria-hidden="true" className="size-4" />
                Edit details
              </Button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <Row label="Mobile" value={initial.phone} />
              <Row label="City" value={[initial.city, initial.state].filter(Boolean).join(", ")} />
              <Row
                label="Exam"
                value={[exam?.shortName, initial.examYear].filter(Boolean).join(" ")}
              />
              <Row label="Claiming" value={badge} />
              <Row label="Rank" value={formatRank(initial.rank)} />
              <Row label="Roll number" value={initial.rollNumber} />
              <Row
                label="Languages"
                value={initial.languages
                  .map((language) => PREP_LANGUAGE_LABELS[language])
                  .join(", ")}
              />
              <Row
                label="Government job"
                value={
                  initial.inGovernmentService === "yes"
                    ? "Yes"
                    : initial.inGovernmentService === "no"
                      ? "No"
                      : null
                }
              />
            </dl>
            {initial.bio ? (
              <p className="text-ink-muted mt-4 line-clamp-3 text-sm whitespace-pre-line">
                {initial.bio}
              </p>
            ) : null}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
