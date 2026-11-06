"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/** Last-resort error screen when the root layout itself fails. */
export default function GlobalError({
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
    <html lang="en-IN">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: "4rem 1rem",
          maxWidth: 520,
          margin: "0 auto",
          color: "#18233f",
        }}
      >
        <h1 style={{ fontSize: 28 }}>Something went wrong</h1>
        <p style={{ color: "#4b5675" }}>
          Please try again. If it keeps happening, write to us
          {error.digest ? ` with this code: ${error.digest}` : ""}.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 16,
            padding: "10px 18px",
            background: "#2b4fc7",
            color: "#fff",
            border: 0,
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
