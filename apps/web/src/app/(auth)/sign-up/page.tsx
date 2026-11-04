import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { GoogleButton, OrDivider } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isGoogleLoginEnabled } from "@/env";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignUpPage() {
  if (await getSession()) redirect("/dashboard");

  const googleEnabled = isGoogleLoginEnabled();

  return (
    <AuthCard
      title="Create your account"
      description="Free to join. You only pay when you book a session."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/sign-in" className="text-pen font-semibold">
            Sign in
          </Link>
        </>
      }
    >
      {googleEnabled ? (
        <>
          <GoogleButton callbackPath="/onboarding" />
          <OrDivider />
        </>
      ) : null}
      <SignUpForm />
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
