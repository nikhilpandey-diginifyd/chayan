"use client";

import { useActionState, useState } from "react";
import { REVIEW_POLICY } from "@chayan/shared";
import { saveSessionNotesAction, type BookingActionState } from "@/app/bookings/[id]/actions";
import { Button } from "@/components/ui/button";
import { FormMessage, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function NotesForm({
  bookingId,
  initial,
}: {
  bookingId: string;
  initial: { sessionSummary: string; nextSteps: string };
}) {
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    saveSessionNotesAction,
    {},
  );
  const [values, setValues] = useState(initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      {state.done ? (
        <FormMessage tone="success">Notes saved. The aspirant can see them now.</FormMessage>
      ) : null}
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
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save notes"}
      </Button>
    </form>
  );
}
