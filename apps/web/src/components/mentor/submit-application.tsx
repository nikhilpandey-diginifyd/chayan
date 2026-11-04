"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { submitMentorApplication, type SubmitState } from "@/app/mentor/apply/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";

export function SubmitApplication({ ready, blockers }: { ready: boolean; blockers: string[] }) {
  const [state, formAction, pending] = useActionState<SubmitState, FormData>(
    submitMentorApplication,
    {},
  );
  const [consent, setConsent] = useState(false);

  return (
    <form action={formAction} className="space-y-5">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {!ready ? (
        <FormMessage tone="info">
          Before you can submit: {blockers.join(", ").toLowerCase()}.
        </FormMessage>
      ) : null}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="consent"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="accent-pen mt-1 size-4 shrink-0"
        />
        <span className="text-ink-muted">
          The information and documents I&apos;ve shared are genuine and my own. I am 18 or older
          and agree to the{" "}
          <Link href="/terms" target="_blank" className="text-pen underline underline-offset-2">
            terms of service
          </Link>
          , including the rules for mentors.
        </span>
      </label>
      <Button type="submit" size="lg" disabled={!ready || !consent || pending}>
        {pending ? "Submitting…" : "Submit for review"}
      </Button>
    </form>
  );
}
