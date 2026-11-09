"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";

type SharedFile = { id: string; fileName: string; contentType: string; mine: boolean };

/** Share photos of answer copies or PDFs during the session. Refreshes every 10 seconds. */
export function SessionFiles({ bookingId }: { bookingId: string }) {
  const [files, setFiles] = useState<SharedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const response = await fetch(`/api/bookings/${bookingId}/attachments`).catch(() => null);
    if (response?.ok) setFiles((await response.json()) as SharedFile[]);
  }, [bookingId]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 10_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [load]);

  async function upload(file: File) {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Files must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    const body = new FormData();
    body.set("file", file);
    const response = await fetch(`/api/bookings/${bookingId}/attachments`, {
      method: "POST",
      body,
    }).catch(() => null);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (!response?.ok) {
      const data = (await response?.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "Upload failed. Try again.");
      return;
    }
    await load();
  }

  return (
    <section className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-4">
      <h2 className="font-semibold">Shared files</h2>
      <p className="text-ink-muted mt-1 text-sm">
        Share a photo of your answer copy or a PDF. Only the two of you can open it.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        capture="environment"
        className="sr-only"
        id="session-file"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="mt-3"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : "Share a photo or PDF"}
      </Button>
      {error ? (
        <div className="mt-3">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      ) : null}
      {files.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {files.map((file) => (
            <li key={file.id}>
              <a
                href={`/api/booking-files/${file.id}`}
                target="_blank"
                rel="noopener"
                className="border-line hover:border-ink-muted flex items-center gap-2 rounded-[var(--radius-control)] border px-3 py-2 text-sm"
              >
                {file.contentType === "application/pdf" ? (
                  <FileText aria-hidden="true" className="text-pen size-4 shrink-0" />
                ) : (
                  <ImageIcon aria-hidden="true" className="text-pen size-4 shrink-0" />
                )}
                <span className="truncate">{file.fileName}</span>
                <span className="text-ink-muted ml-auto shrink-0 text-xs">
                  {file.mine ? "You" : "Them"}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
