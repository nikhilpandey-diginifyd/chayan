"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function ResendVerification({
  email,
  callbackPath,
}: {
  email: string;
  callbackPath: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setState("sending");
    setError(null);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: callbackPath,
    });
    if (error) {
      setError(authErrorMessage(error));
      setState("idle");
      return;
    }
    setState("sent");
  }

  return (
    <div className="mt-6 space-y-4">
      {state === "sent" ? (
        <FormMessage tone="success">We sent a new link. Check your inbox.</FormMessage>
      ) : null}
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        onClick={resend}
        disabled={state === "sending"}
      >
        {state === "sending" ? "Sending…" : "Send the link again"}
      </Button>
    </div>
  );
}
