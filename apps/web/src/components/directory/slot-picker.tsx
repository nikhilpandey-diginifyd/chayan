"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  BOOKING_POLICY,
  formatRupees,
  groupSlotsByIstDate,
  formatMinuteOfDay,
} from "@chayan/shared";
import { bookSession, type BookState } from "@/app/mentors/[slug]/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import { FormMessage, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { formatIstDay, minuteOfIstDay } from "./format";

type Option = { durationMinutes: number; pricePaise: number; slots: string[] };
type Viewer = "signed_out" | "self" | "preview" | "aspirant";

export function SlotPicker({
  options,
  slug,
  viewer,
}: {
  options: Option[];
  slug: string;
  viewer: Viewer;
}) {
  const [state, formAction, pending] = useActionState<BookState, FormData>(bookSession, {});
  const [note, setNote] = useState("");
  const [duration, setDuration] = useState(options[0]?.durationMinutes ?? 30);
  const selected = options.find((option) => option.durationMinutes === duration) ?? options[0];

  const days = useMemo(
    () => groupSlotsByIstDate((selected?.slots ?? []).map((slot) => new Date(slot))),
    [selected],
  );
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);

  const activeDay = days.find((day) => day.dateKey === dateKey) ?? days[0];

  if (!selected) return <p className="text-ink-muted mt-4">No sessions offered right now.</p>;

  return (
    <div className="mt-5 space-y-6">
      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold">Session length</legend>
        <div
          className="mt-2 grid gap-2"
          style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
          {options.map((option) => {
            const checked = option.durationMinutes === duration;
            return (
              <label
                key={option.durationMinutes}
                className={cn(
                  "relative cursor-pointer rounded-[var(--radius-control)] border px-3 py-2 text-center",
                  checked ? "border-pen bg-pen text-white" : "border-line hover:border-ink-muted",
                )}
              >
                <input
                  type="radio"
                  name="duration"
                  className="sr-only"
                  checked={checked}
                  onChange={() => {
                    setDuration(option.durationMinutes);
                    setDateKey(null);
                    setSlot(null);
                  }}
                />
                <span className="block font-semibold">{option.durationMinutes} min</span>
                <span className={cn("block text-sm", checked ? "text-white/90" : "text-ink-muted")}>
                  {formatRupees(option.pricePaise)}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {days.length === 0 ? (
        <p className="text-ink-muted">No free slots in the next few days. Check back soon.</p>
      ) : (
        <>
          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold">Day (IST)</legend>
            <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
              {days.map((day) => {
                const checked = day.dateKey === activeDay?.dateKey;
                return (
                  <label
                    key={day.dateKey}
                    className={cn(
                      "relative shrink-0 cursor-pointer rounded-[var(--radius-control)] border px-3 py-2 text-sm whitespace-nowrap",
                      checked ? "border-pen ring-pen ring-1" : "border-line hover:border-ink-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="day"
                      className="sr-only"
                      checked={checked}
                      onChange={() => {
                        setDateKey(day.dateKey);
                        setSlot(null);
                      }}
                    />
                    <span className="block font-semibold">{formatIstDay(day.dateKey)}</span>
                    <span className="text-ink-muted block">{day.slots.length} slots</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className="text-sm font-semibold">Start time</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {activeDay?.slots.map((instant) => {
                const iso = instant.toISOString();
                const checked = slot === iso;
                return (
                  <label
                    key={iso}
                    className={cn(
                      "relative cursor-pointer rounded-[var(--radius-control)] border px-2 py-2 text-center text-sm",
                      checked
                        ? "border-pen bg-pen font-semibold text-white"
                        : "border-line hover:border-ink-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name="slot"
                      className="sr-only"
                      checked={checked}
                      onChange={() => setSlot(iso)}
                    />
                    {formatMinuteOfDay(minuteOfIstDay(instant))}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </>
      )}

      {viewer === "aspirant" ? (
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="durationMinutes" value={selected.durationMinutes} />
          <input type="hidden" name="startsAt" value={slot ?? ""} />
          <div>
            <label htmlFor="note" className="text-sm font-semibold">
              What do you want help with? (optional)
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              maxLength={BOOKING_POLICY.noteMaxLength}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="For example: my GS answers score low, I want a plan for the next 3 months"
              className={cn(inputClassName, "mt-1 h-auto py-2 text-sm")}
            />
          </div>
          {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
          <Button type="submit" className="w-full" disabled={!slot || pending}>
            {pending
              ? "Reserving your slot…"
              : slot
                ? `Continue to pay ${formatRupees(selected.pricePaise)}`
                : "Choose a time"}
          </Button>
          <p className="text-ink-muted text-center text-sm">
            We hold the slot for {BOOKING_POLICY.holdMinutes} minutes while you pay. Full refund if
            you cancel 12 hours or more before.
          </p>
        </form>
      ) : viewer === "signed_out" ? (
        <div className="space-y-2">
          <ButtonLink
            href={`/sign-in?next=${encodeURIComponent(`/mentors/${slug}`)}`}
            className="w-full"
          >
            Sign in to book
          </ButtonLink>
          <p className="text-ink-muted text-center text-sm">
            New here?{" "}
            <Link
              href={`/sign-up?next=${encodeURIComponent(`/mentors/${slug}`)}`}
              className="text-pen font-semibold"
            >
              Create a free account
            </Link>
          </p>
        </div>
      ) : (
        <p className="border-line bg-paper text-ink-muted rounded-[var(--radius-control)] border px-4 py-3 text-sm">
          {viewer === "self"
            ? "This is how aspirants see your booking panel. You can't book yourself."
            : "Booking opens once this profile is published."}
        </p>
      )}
    </div>
  );
}
