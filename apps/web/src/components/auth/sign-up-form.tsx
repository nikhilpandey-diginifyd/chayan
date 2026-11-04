"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { authErrorMessage } from "@/lib/auth-errors";

export function SignUpForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setPending(true);
    setError(null);

    const { error } = await authClient.signUp.email({
      name: String(form.get("name") ?? "").trim(),
      email,
      password: String(form.get("password") ?? ""),
      callbackURL: "/onboarding",
    });

    if (error) {
      setError(authErrorMessage(error));
      setPending(false);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Field id="name" label="Full name">
        <Input id="name" name="name" autoComplete="name" required minLength={2} maxLength={80} />
      </Field>
      <Field id="email" label="Email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field id="password" label="Password" hint="At least 8 characters.">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
          aria-describedby="password-hint"
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
