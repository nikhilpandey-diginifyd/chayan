import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { FormMessage } from "@/components/ui/field";

export const metadata: Metadata = { title: "Choose a new password" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;

  return (
    <AuthCard
      title="Choose a new password"
      footer={
        <Link href="/sign-in" className="text-pen font-semibold">
          Back to sign in
        </Link>
      }
    >
      {token && !params.error ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="space-y-4">
          <FormMessage tone="error">This reset link has expired or was already used.</FormMessage>
          <Link href="/forgot-password" className="text-pen font-semibold">
            Request a new link
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
