"use client";

import { useState, useTransition, type FormEvent } from "react";
import { addVideo, type VideoFormState } from "@/app/admin/videos/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function VideoForm({ exams }: { exams: { id: string; shortName: string }[] }) {
  const [state, setState] = useState<VideoFormState>({});
  const [pending, startTransition] = useTransition();

  // Submitting by hand keeps what the admin typed if the server finds a problem.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await addVideo({}, formData);
      setState(result);
      if (result.done) form.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {state.done ? <FormMessage tone="success">Video added and live.</FormMessage> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      <Field
        id="url"
        label="YouTube link"
        hint="A normal video or a Short. Unlisted videos work too."
      >
        <Input id="url" name="url" required placeholder="https://www.youtube.com/watch?v=..." />
      </Field>
      <Field id="title" label="Title">
        <Input id="title" name="title" required minLength={5} maxLength={150} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-3">
        <Field id="examId" label="Exam">
          <Select id="examId" name="examId" defaultValue="">
            <option value="">All exams</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.shortName}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="topic" label="Topic (optional)" hint="For example Polity, Quant.">
          <Input id="topic" name="topic" maxLength={60} />
        </Field>
        <Field id="sortOrder" label="Order" hint="Lower numbers show first.">
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            max={9999}
            defaultValue={100}
          />
        </Field>
      </div>
      <Field id="description" label="Description (optional)">
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={1000}
          className={cn(inputClassName, "h-auto py-2")}
        />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add video"}
      </Button>
    </form>
  );
}
