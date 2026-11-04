"use client";

import { useActionState, useState } from "react";
import { MENTOR_BADGE_INFO, type MentorBadge } from "@chayan/shared";
import { reviewMentorApplication, type ReviewState } from "@/app/admin/mentors/[id]/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Select, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Decision = "approve" | "request_changes" | "reject";

const decisionLabels: Record<Decision, string> = {
  approve: "Approve",
  request_changes: "Request changes",
  reject: "Reject",
};

export function ReviewForm({
  applicationId,
  claimedBadge,
  badgeOptions,
}: {
  applicationId: string;
  claimedBadge: MentorBadge;
  badgeOptions: MentorBadge[];
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(
    reviewMentorApplication,
    {},
  );
  const [decision, setDecision] = useState<Decision>("approve");
  const [badge, setBadge] = useState<MentorBadge>(claimedBadge);
  const [checked, setChecked] = useState(false);
  const [note, setNote] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="applicationId" value={applicationId} />
      <input type="hidden" name="decision" value={decision} />
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <div
        className="border-line grid grid-cols-3 gap-1 rounded-[var(--radius-control)] border p-1"
        role="radiogroup"
        aria-label="Decision"
      >
        {(Object.keys(decisionLabels) as Decision[]).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={decision === option}
            onClick={() => setDecision(option)}
            className={cn(
              "rounded-md px-2 py-2 text-sm font-semibold",
              decision === option ? "bg-ink text-white" : "text-ink-muted hover:text-ink",
            )}
          >
            {decisionLabels[option]}
          </button>
        ))}
      </div>

      {decision === "approve" ? (
        <>
          <Field
            id="badge"
            label="Badge to grant"
            hint="Grant a lower badge if the documents only prove an earlier stage."
          >
            <Select
              id="badge"
              name="badge"
              value={badge}
              onChange={(event) => setBadge(event.target.value as MentorBadge)}
            >
              {badgeOptions.map((option) => (
                <option key={option} value={option}>
                  {MENTOR_BADGE_INFO[option].label}
                  {option === claimedBadge ? " (claimed)" : ""}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="checked"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="accent-pen mt-0.5 size-4 shrink-0"
            />
            I checked the documents against the official result and the checklist above.
          </label>
        </>
      ) : null}

      <Field
        id="note"
        label={decision === "approve" ? "Internal note (optional)" : "Message to the applicant"}
        hint={
          decision === "approve"
            ? undefined
            : "The applicant sees this in their email and on their application."
        }
      >
        <textarea
          id="note"
          name="note"
          rows={4}
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className={cn(inputClassName, "h-auto py-2")}
        />
      </Field>

      <Button
        type="submit"
        className="w-full"
        disabled={pending || (decision === "approve" && !checked)}
      >
        {pending ? "Saving…" : `${decisionLabels[decision]} application`}
      </Button>
    </form>
  );
}
