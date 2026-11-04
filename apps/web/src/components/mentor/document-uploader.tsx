"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { FileText, Trash2 } from "lucide-react";
import {
  MENTOR_DOCUMENT_INFO,
  MENTOR_DOCUMENT_KINDS,
  MENTOR_DOCUMENT_LIMITS,
  type MentorDocumentKind,
} from "@chayan/shared";
import { deleteMentorDocument } from "@/app/mentor/apply/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/field";

type UploadedDocument = {
  id: string;
  kind: MentorDocumentKind;
  fileName: string;
  sizeBytes: number;
};

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function KindUpload({
  kind,
  documents,
  editable,
}: {
  kind: MentorDocumentKind;
  documents: UploadedDocument[];
  editable: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();
  const info = MENTOR_DOCUMENT_INFO[kind];

  async function upload(file: File) {
    setError(null);
    if (file.size > MENTOR_DOCUMENT_LIMITS.maxBytes) {
      setError("Files must be 5 MB or smaller.");
      return;
    }
    setUploading(true);
    const body = new FormData();
    body.set("kind", kind);
    body.set("file", file);
    try {
      const response = await fetch("/api/mentor/documents", { method: "POST", body });
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

  const busy = uploading || isRefreshing;

  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-md">
          <p className="font-semibold">
            {info.label}
            {info.required ? (
              <span className="text-omr ml-2 text-sm font-medium">Required</span>
            ) : null}
          </p>
          <p className="text-ink-muted mt-1 text-sm">{info.hint}</p>
        </div>
        {editable ? (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
              className="sr-only"
              id={`upload-${kind}`}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
              }}
              disabled={busy}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              {busy ? "Uploading…" : documents.length > 0 ? "Add another" : "Upload file"}
            </Button>
          </>
        ) : null}
      </div>
      {error ? (
        <div className="mt-3">
          <FormMessage tone="error">{error}</FormMessage>
        </div>
      ) : null}
      {documents.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {documents.map((document) => (
            <li
              key={document.id}
              className="border-line bg-paper flex items-center justify-between gap-3 rounded-[var(--radius-control)] border px-3 py-2"
            >
              <a
                href={`/api/documents/${document.id}`}
                target="_blank"
                rel="noopener"
                className="text-pen flex min-w-0 items-center gap-2 text-sm"
              >
                <FileText aria-hidden="true" className="size-4 shrink-0" />
                <span className="truncate">{document.fileName}</span>
                <span className="text-ink-muted shrink-0">{formatSize(document.sizeBytes)}</span>
              </a>
              {editable ? (
                <form action={deleteMentorDocument}>
                  <input type="hidden" name="documentId" value={document.id} />
                  <button
                    type="submit"
                    className="text-ink-muted hover:text-omr rounded-md p-1"
                    aria-label={`Remove ${document.fileName}`}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function DocumentUploader({
  documents,
  editable,
}: {
  documents: UploadedDocument[];
  editable: boolean;
}) {
  return (
    <div>
      <p className="text-ink-muted text-sm">
        PDF, JPG, PNG or WebP, up to 5 MB each. Only our verification team can see these files.
      </p>
      <ul className="divide-line divide-y">
        {MENTOR_DOCUMENT_KINDS.map((kind) => (
          <KindUpload
            key={kind}
            kind={kind}
            editable={editable}
            documents={documents.filter((document) => document.kind === kind)}
          />
        ))}
      </ul>
    </div>
  );
}
