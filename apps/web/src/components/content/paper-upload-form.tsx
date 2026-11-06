"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { PAPER_LANGUAGE_LABELS, PAPER_LANGUAGES } from "@chayan/shared";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function PaperUploadForm({ exams }: { exams: { id: string; shortName: string }[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const thisYear = new Date().getFullYear();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const response = await fetch("/api/admin/papers", {
      method: "POST",
      body: new FormData(event.currentTarget),
    }).catch(() => null);
    const data = (await response?.json().catch(() => null)) as {
      error?: string;
      slug?: string;
    } | null;
    setPending(false);
    if (!response?.ok) {
      setMessage({ tone: "error", text: data?.error ?? "Upload failed. Try again." });
      return;
    }
    formRef.current?.reset();
    setMessage({ tone: "success", text: "Paper added and live." });
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="examId" label="Exam">
          <Select id="examId" name="examId" required defaultValue="">
            <option value="" disabled>
              Choose an exam
            </option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.shortName}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="year" label="Year">
          <Input
            id="year"
            name="year"
            type="number"
            min={1990}
            max={thisYear}
            defaultValue={thisYear - 1}
            required
          />
        </Field>
        <Field id="language" label="Language">
          <Select id="language" name="language" defaultValue="english">
            {PAPER_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {PAPER_LANGUAGE_LABELS[language]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field
        id="title"
        label="Title"
        hint='For example "Prelims GS Paper 1" or "Tier 1, 9 Sep 2024, Shift 2".'
      >
        <Input id="title" name="title" required minLength={3} maxLength={150} />
      </Field>
      <Field
        id="description"
        label="Short description (optional)"
        hint="Shown on the paper's page. Helps it appear in Google."
      >
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={1000}
          className={cn(inputClassName, "h-auto py-2")}
        />
      </Field>
      <Field id="sourceUrl" label="Official source link (optional)">
        <Input id="sourceUrl" name="sourceUrl" type="url" placeholder="https://upsc.gov.in/..." />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="file" label="Question paper (PDF, up to 20 MB)">
          <Input
            id="file"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required
            className="py-2"
          />
        </Field>
        <Field id="answerKey" label="Answer key (optional PDF)">
          <Input
            id="answerKey"
            name="answerKey"
            type="file"
            accept="application/pdf,.pdf"
            className="py-2"
          />
        </Field>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Add paper"}
      </Button>
    </form>
  );
}
