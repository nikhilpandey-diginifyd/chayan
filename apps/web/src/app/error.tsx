"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-4 py-24">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="text-ink-muted mt-3">
        This page hit an error. Try again, and if it keeps happening, write to us from the contact
        page{error.digest ? ` with this code: ${error.digest}` : ""}.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Link href="/" className="text-pen inline-flex h-11 items-center px-4 font-semibold">
          Go to home page
        </Link>
      </div>
    </div>
  );
}
