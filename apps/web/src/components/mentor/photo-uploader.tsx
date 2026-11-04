"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";
import { Avatar } from "./avatar";

export function PhotoUploader({ name, url }: { name: string; url: string | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, startTransition] = useTransition();

  async function upload(file: File) {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Use a photo of 5 MB or less.");
      return;
    }
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    try {
      const response = await fetch("/api/mentor/photo", { method: "POST", body });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Upload failed. Try again.");
        return;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const busy = uploading || refreshing;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <Avatar name={name} url={url} size={96} />
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id="photo"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
        </Button>
        <p className="text-ink-muted text-sm">
          A clear, recent photo of your face. JPG, PNG or WebP. We crop it to a square.
        </p>
        {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      </div>
    </div>
  );
}
