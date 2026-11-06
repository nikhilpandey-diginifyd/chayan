"use client";

import { useActionState, useState } from "react";
import { REVIEW_POLICY } from "@chayan/shared";
import { saveSessionNotesAction, type BookingActionState } from "@/app/bookings/[id]/actions";
import { Button } from "@/components/ui/button";
import { FormMessage, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type NotesValues = { sessionSummary: string; nextSteps: string };

/** Shows saved notes read-only, with an Edit button. */
export function NotesSection({ bookingId, initial }: { bookingId: string; initial: NotesValues }) {
  const hasNotes = Boolean(initial.sessionSummary || initial.nextSteps);
  const [editing, setEditing] = useState(!hasNotes);
  const [justSaved, setJustSaved] = useState(false);

  if (hasNotes && !editing) {
    return (
      <div className="space-y-4">
        {justSaved ? (
          <FormMessage tone="success">Notes saved. The aspirant can see them now.</FormMessage>
        ) : null}
        {initial.sessionSummary ? (
          <div>
            <h3 className="text-sm font-semibold">What you discussed</h3>
            <p className="text-ink-muted mt-1 whitespace-pre-line">{initial.sessionSummary}</p>
          </div>
        ) : null}
        {initial.nextSteps ? (
          <div>
            <h3 className="text-sm font-semibold">Next steps for the aspirant</h3>
            <p className="mt-1 whitespace-pre-line">{initial.nextSteps}</p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setJustSaved(false);
            setEditing(true);
          }}
        >
          Edit notes
        </Button>
      </div>
    );
  }

  return (
    <NotesForm
      bookingId={bookingId}
      initial={initial}
      onSaved={() => {
        setJustSaved(true);
        setEditing(false);
      }}
      onCancel={hasNotes ? () => setEditing(false) : undefined}
    />
  );
}

function NotesForm({
  bookingId,
  initial,
  onSaved,
  onCancel,
}: {
  bookingId: string;
  initial: NotesValues;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    async (previous, formData) => {
      const result = await saveSessionNotesAction(previous, formData);
      if (result.done) onSaved();
      return result;
    },
    {},
  );
  const [values, setValues] = useState(initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      <div>
        <label htmlFor="sessionSummary" className="text-sm font-semibold">
          What you discussed
        </label>
        <textarea
          id="sessionSummary"
          name="sessionSummary"
          rows={4}
          maxLength={REVIEW_POLICY.notesMaxLength}
          value={values.sessionSummary}
          onChange={(event) => setValues({ ...values, sessionSummary: event.target.value })}
          className={cn(inputClassName, "mt-1 h-auto py-2 text-sm")}
        />
      </div>
      <div>
        <label htmlFor="nextSteps" className="text-sm font-semibold">
          Next steps for the aspirant
        </label>
        <textarea
          id="nextSteps"
          name="nextSteps"
          rows={4}
          maxLength={REVIEW_POLICY.notesMaxLength}
          value={values.nextSteps}
          placeholder={
            "For example:\n1. Write two GS2 answers daily, 150 words each\n2. Revise Polity chapters 1–8 by Sunday"
          }
          onChange={(event) => setValues({ ...values, nextSteps: event.target.value })}
          className={cn(inputClassName, "mt-1 h-auto py-2 text-sm")}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save notes"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
