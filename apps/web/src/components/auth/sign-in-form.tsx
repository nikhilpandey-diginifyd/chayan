"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { useHydrated } from "@/lib/use-hydrated";
import { authErrorMessage } from "@/lib/auth-errors";

export function SignInForm({ next }: { next: string }) {
  const hydrated = useHydrated();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);

    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      callbackURL: next,
    });

    if (error) {
      setError(authErrorMessage(error));
      setPending(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="space-y-5">
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <Field id="email" label="Email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        id="password"
        label="Password"
        hint={
          <Link href="/forgot-password" className="text-pen">
            Forgot your password?
          </Link>
        }
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={!hydrated || pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
