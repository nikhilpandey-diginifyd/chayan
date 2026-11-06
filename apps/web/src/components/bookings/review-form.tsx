"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { REVIEW_POLICY, REVIEW_TAG_LABELS, REVIEW_TAGS, type ReviewTag } from "@chayan/shared";
import { saveReviewAction, type BookingActionState } from "@/app/bookings/[id]/actions";
import { Button } from "@/components/ui/button";
import { FormMessage, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const ratingWords = ["", "Poor", "Below expectations", "Okay", "Good", "Excellent"];

export function ReviewForm({
  bookingId,
  mentorName,
  initial,
}: {
  bookingId: string;
  mentorName: string;
  initial?: {
    rating: number;
    tags: string[];
    comment: string | null;
    mentorOnCamera: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    saveReviewAction,
    {},
  );
  const [rating, setRating] = useState(initial?.rating ?? 0);
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [camera, setCamera] = useState(initial?.mentorOnCamera ?? "");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating} />
      {state.done ? <FormMessage tone="success">Thanks! Your review is saved.</FormMessage> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <fieldset>
        <legend className="font-semibold">How was your session with {mentorName}?</legend>
        <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={rating === value}
              aria-label={`${value} star${value === 1 ? "" : "s"}`}
              onClick={() => setRating(value)}
              className="rounded p-1"
            >
              <Star
                aria-hidden="true"
                className={cn("size-8", value <= rating ? "fill-omr text-omr" : "text-line")}
              />
            </button>
          ))}
          <span className="text-ink-muted ml-2 text-sm">{ratingWords[rating]}</span>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">What stood out? (optional)</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {REVIEW_TAGS.map((tag: ReviewTag) => {
            const checked = tags.includes(tag);
            return (
              <label
                key={tag}
                className={cn(
                  "bg-surface flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm",
                  checked ? "border-pen ring-pen ring-1" : "border-line hover:border-ink-muted",
                )}
              >
                <input
                  type="checkbox"
                  name="tags"
                  value={tag}
                  checked={checked}
                  onChange={() =>
                    setTags(checked ? tags.filter((item) => item !== tag) : [...tags, tag])
                  }
                  className="accent-pen size-4 shrink-0"
                />
                {REVIEW_TAG_LABELS[tag]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold">Was the mentor on camera?</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {[
            ["yes", "Yes"],
            ["partly", "Part of the time"],
            ["no", "No"],
          ].map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="mentorOnCamera"
                value={value}
                checked={camera === value}
                onChange={() => setCamera(value!)}
                className="accent-pen size-4"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="comment" className="text-sm font-semibold">
          Anything else? (optional, shown publicly with your first name)
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          maxLength={REVIEW_POLICY.commentMaxLength}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className={cn(inputClassName, "mt-1 h-auto py-2 text-sm")}
        />
      </div>

      <Button type="submit" disabled={pending || rating === 0}>
        {pending ? "Saving…" : initial ? "Update review" : "Submit review"}
      </Button>
    </form>
  );
}
