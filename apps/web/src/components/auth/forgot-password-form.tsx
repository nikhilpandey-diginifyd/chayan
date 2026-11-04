"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email") ?? "").trim(),
      redirectTo: "/reset-password",
    });

    setPending(false);
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <FormMessage tone="success">
        If an account exists for that email, you&apos;ll get a reset link in a minute. Check your
        spam folder too.
      </FormMessage>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Field id="email" label="Email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
