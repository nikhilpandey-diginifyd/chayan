import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResendVerification } from "@/components/auth/resend-verification";

export const metadata: Metadata = { title: "Confirm your email" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams;
  const email = typeof params.email === "string" ? params.email : "";

  return (
    <AuthCard
      title="Check your inbox"
      description={
        email ? (
          <>
            We sent a confirmation link to <strong className="text-ink">{email}</strong>. Open it to
            finish creating your account.
          </>
        ) : (
          "We sent you a confirmation link. Open it to finish creating your account."
        )
      }
      footer={
        <Link href="/sign-in" className="text-pen font-semibold">
          Back to sign in
        </Link>
      }
    >
      <p className="text-ink-muted text-sm">
        Can&apos;t find it? Check your spam or promotions folder. The link works for 24 hours.
      </p>
      {email ? <ResendVerification email={email} /> : null}
    </AuthCard>
  );
}
