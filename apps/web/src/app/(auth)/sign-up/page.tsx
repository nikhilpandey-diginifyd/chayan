import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isGoogleLoginEnabled } from "@/env";
import { safeRedirectPath } from "@/lib/redirects";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SignUpPage({ searchParams }: Props) {
  const params = await searchParams;
  const next = safeRedirectPath(params.next, "/onboarding");

  if (await getSession()) redirect(next === "/onboarding" ? "/dashboard" : next);

  const googleEnabled = isGoogleLoginEnabled();

  return (
    <AuthCard
      title="Create your account"
      description="Free to join. You only pay when you book a session."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={params.next ? `/sign-in?next=${encodeURIComponent(next)}` : "/sign-in"}
            className="text-pen font-semibold"
          >
            Sign in
          </Link>
        </>
      }
    >
      {googleEnabled ? (
        <>
          <GoogleButton callbackPath={next} />
          <OrDivider />
        </>
      ) : null}
      <SignUpForm callbackPath={next} />
      <p className="text-ink-muted mt-6 text-sm">
        By creating an account, you confirm you are 18 or older and agree to our{" "}
        <Link href="/terms" className="text-pen underline underline-offset-2">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-pen underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </AuthCard>
  );
}
