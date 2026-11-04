import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { SignInForm } from "@/components/auth/sign-in-form";
import { FormMessage } from "@/components/ui/field";
import { isGoogleLoginEnabled } from "@/env";
import { safeRedirectPath } from "@/lib/redirects";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SignInPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next);

  if (await getSession()) redirect(next);

  const googleEnabled = isGoogleLoginEnabled();
  const signUpHref = params.next ? `/sign-up?next=${encodeURIComponent(next)}` : "/sign-up";

  return (
    <AuthCard
      title="Sign in"
      description="Book sessions and pick up where you left off."
      footer={
        <>
          New here?{" "}
          <Link href={signUpHref} className="text-pen font-semibold">
            Create an account
          </Link>
        </>
      }
    >
      {params.error ? (
        <div className="mb-6">
          <FormMessage tone="error">
            Sign-in didn&apos;t finish. Try again, or use your email and password.
          </FormMessage>
        </div>
      ) : null}
      {googleEnabled ? (
        <>
          <GoogleButton callbackPath={next} />
          <OrDivider />
        </>
      ) : null}
      <SignInForm next={next} />
    </AuthCard>
  );
}
