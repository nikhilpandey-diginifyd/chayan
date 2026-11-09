"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/**
 * Account links in the header. Rendered on the client so marketing pages
 * stay static and fast.
 */
export function HeaderAccount() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) {
    return <span className="skeleton inline-block h-9 w-24" aria-hidden="true" />;
  }

  if (!session) {
    return (
      <ButtonLink href="/sign-in" variant="secondary" size="sm" className="whitespace-nowrap">
        Sign in
      </ButtonLink>
    );
  }

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Link
        href="/dashboard"
        className="text-ink hover:text-pen hidden rounded-full px-3 py-1.5 font-semibold transition-colors sm:block"
      >
        Dashboard
      </Link>
      <Button
        variant="secondary"
        size="sm"
        className="whitespace-nowrap"
        onClick={signOut}
        disabled={signingOut}
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
