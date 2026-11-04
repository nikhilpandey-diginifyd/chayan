"use client";

import { useActionState, useMemo, useState, useSyncExternalStore } from "react";
import { Plus, X } from "lucide-react";
import {
  BOOKING_WINDOW_OPTIONS,
  BUFFER_OPTIONS,
  formatMinuteOfDay,
  generateSlots,
  groupSlotsByIstDate,
  istDateKey,
  istToInstant,
  MIN_NOTICE_OPTIONS,
  SLOT_STEP_MINUTES,
  validateRules,
  WEEKDAYS,
  type AvailabilityRule,
} from "@chayan/shared";
import { saveMentorAvailability, type FormState } from "@/app/mentor/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Field, FormMessage, Input, Select } from "@/components/ui/field";

type Initial = {
  rules: AvailabilityRule[];
  blockedDates: string[];
  bufferMinutes: number;
  minNoticeHours: number;
  bookingWindowDays: number;
};

const TIME_OPTIONS = Array.from(
  { length: (24 * 60) / SLOT_STEP_MINUTES + 1 },
  (_, index) => index * SLOT_STEP_MINUTES,
);

const timeLabel = (minute: number) =>
  minute === 1440 ? "12:00 AM (midnight)" : formatMinuteOfDay(minute);

const dateLabel = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

const subscribeNothing = () => () => {};

/** True only in the browser, so time-based output never differs between server and client. */
function useIsClient() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

function noticeLabel(hours: number) {
  return hours < 24
    ? `${hours} hour${hours === 1 ? "" : "s"}`
    : `${hours / 24} day${hours === 24 ? "" : "s"}`;
}

export function AvailabilityEditor({
  initial,
  previewDuration,
}: {
  initial: Initial;
  previewDuration: number;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    saveMentorAvailability,
    {},
  );
  const [rules, setRules] = useState<AvailabilityRule[]>(initial.rules);
  const [blockedDates, setBlockedDates] = useState<string[]>(initial.blockedDates);
  const [newBlocked, setNewBlocked] = useState("");
  const [settings, setSettings] = useState({
    bufferMinutes: initial.bufferMinutes,
    minNoticeHours: initial.minNoticeHours,
    bookingWindowDays: initial.bookingWindowDays,
  });

  const problems = validateRules(rules);
  const isClient = useIsClient();
  const today = istDateKey(new Date());

  const preview = useMemo(() => {
    if (!isClient || problems.length > 0) return [];
    const slots = generateSlots({
      rules,
      blockedDates,
      durationMinutes: previewDuration,
      ...settings,
    });
    return groupSlotsByIstDate(slots).slice(0, 3);
  }, [rules, blockedDates, settings, previewDuration, problems.length, isClient]);

  function rangesFor(weekday: number) {
    return rules
      .map((rule, index) => ({ rule, index }))
      .filter(({ rule }) => rule.weekday === weekday)
      .sort((a, b) => a.rule.startMinute - b.rule.startMinute);
  }

  function addRange(weekday: number) {
    const existing = rangesFor(weekday);
    const lastEnd = existing.at(-1)?.rule.endMinute;
    const start = lastEnd !== undefined ? Math.min(lastEnd + 60, 22 * 60) : 18 * 60;
    setRules([...rules, { weekday, startMinute: start, endMinute: Math.min(start + 120, 1440) }]);
  }

  function updateRule(index: number, patch: Partial<AvailabilityRule>) {
    setRules(rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule)));
  }

  function removeRule(index: number) {
    setRules(rules.filter((_, i) => i !== index));
  }

  function copyToWeekdays(weekday: number) {
    const source = rules.filter((rule) => rule.weekday === weekday);
    const targets = [1, 2, 3, 4, 5].filter((day) => day !== weekday);
    setRules([
      ...rules.filter((rule) => !targets.includes(rule.weekday)),
      ...targets.flatMap((day) => source.map((rule) => ({ ...rule, weekday: day }))),
    ]);
  }

  function addBlockedDate() {
    if (!newBlocked || newBlocked < today || blockedDates.includes(newBlocked)) return;
    setBlockedDates([...blockedDates, newBlocked].sort());
    setNewBlocked("");
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="rules" value={JSON.stringify(rules)} />
      <input type="hidden" name="blockedDates" value={JSON.stringify(blockedDates)} />

      {state.saved ? <FormMessage tone="success">Availability saved.</FormMessage> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8">
        <h2 className="text-xl font-bold">Weekly hours</h2>
        <ul className="divide-line mt-4 divide-y">
          {WEEKDAYS.map((day) => {
            const ranges = rangesFor(day.value);
            return (
              <li key={day.value} className="flex flex-wrap items-start gap-4 py-4">
                <span className="w-24 pt-2 font-semibold">{day.long}</span>
                <div className="flex-1 space-y-2">
                  {ranges.length === 0 ? (
                    <p className="text-ink-muted pt-2">Unavailable</p>
                  ) : (
                    ranges.map(({ rule, index }) => (
                      <div key={index} className="flex flex-wrap items-center gap-2">
                        <label className="sr-only" htmlFor={`start-${index}`}>
                          {day.long} start time
                        </label>
                        <Select
                          id={`start-${index}`}
                          value={rule.startMinute}
                          onChange={(event) =>
                            updateRule(index, { startMinute: Number(event.target.value) })
                          }
                          className="w-36"
                        >
                          {TIME_OPTIONS.slice(0, -1).map((minute) => (
                            <option key={minute} value={minute}>
                              {formatMinuteOfDay(minute)}
                            </option>
                          ))}
                        </Select>
                        <span aria-hidden="true" className="text-ink-muted">
                          to
                        </span>
                        <label className="sr-only" htmlFor={`end-${index}`}>
                          {day.long} end time
                        </label>
                        <Select
                          id={`end-${index}`}
                          value={rule.endMinute}
                          onChange={(event) =>
                            updateRule(index, { endMinute: Number(event.target.value) })
                          }
                          className="w-48"
                        >
                          {TIME_OPTIONS.slice(1).map((minute) => (
                            <option key={minute} value={minute}>
                              {timeLabel(minute)}
                            </option>
                          ))}
                        </Select>
                        <button
                          type="button"
                          onClick={() => removeRule(index)}
                          className="text-ink-muted hover:text-omr rounded-md p-2"
                          aria-label={`Remove ${day.long} ${formatMinuteOfDay(rule.startMinute)} range`}
                        >
                          <X aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <button
                    type="button"
                    onClick={() => addRange(day.value)}
                    disabled={ranges.length >= 6}
                    className="text-pen inline-flex items-center gap-1 rounded-md px-2 py-2 text-sm font-semibold disabled:opacity-40"
                  >
                    <Plus aria-hidden="true" className="size-4" />
                    Add hours
                  </button>
                  {ranges.length > 0 && day.value >= 1 && day.value <= 5 ? (
                    <button
                      type="button"
                      onClick={() => copyToWeekdays(day.value)}
                      className="text-ink-muted hover:text-ink px-2 text-sm"
                    >
                      Copy to Mon–Fri
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        {problems.length > 0 ? (
          <div className="mt-4">
            <FormMessage tone="error">{problems[0]}</FormMessage>
          </div>
        ) : null}
      </section>

      <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8">
        <h2 className="text-xl font-bold">Booking rules</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <Field id="bufferMinutes" label="Break between sessions">
            <Select
              id="bufferMinutes"
              name="bufferMinutes"
              value={settings.bufferMinutes}
              onChange={(event) =>
                setSettings({ ...settings, bufferMinutes: Number(event.target.value) })
              }
            >
              {BUFFER_OPTIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes === 0 ? "No break" : `${minutes} minutes`}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="minNoticeHours" label="Minimum notice">
            <Select
              id="minNoticeHours"
              name="minNoticeHours"
              value={settings.minNoticeHours}
              onChange={(event) =>
                setSettings({ ...settings, minNoticeHours: Number(event.target.value) })
              }
            >
              {MIN_NOTICE_OPTIONS.map((hours) => (
                <option key={hours} value={hours}>
                  {noticeLabel(hours)}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="bookingWindowDays" label="Bookable up to">
            <Select
              id="bookingWindowDays"
              name="bookingWindowDays"
              value={settings.bookingWindowDays}
              onChange={(event) =>
                setSettings({ ...settings, bookingWindowDays: Number(event.target.value) })
              }
            >
              {BOOKING_WINDOW_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} days ahead
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </section>

      <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8">
        <h2 className="text-xl font-bold">Days off</h2>
        <p className="text-ink-muted mt-2">
          Block dates when you can&apos;t take sessions, like exam days or travel.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="newBlocked" className="block font-semibold">
              Date
            </label>
            <Input
              id="newBlocked"
              type="date"
              min={today}
              value={newBlocked}
              onChange={(event) => setNewBlocked(event.target.value)}
              className="mt-1.5 w-48"
            />
          </div>
          <Button type="button" variant="secondary" onClick={addBlockedDate} disabled={!newBlocked}>
            Block date
          </Button>
        </div>
        {blockedDates.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {blockedDates.map((date) => (
              <li
                key={date}
                className="border-line bg-paper inline-flex items-center gap-1 rounded-full border py-1 pr-1 pl-3 text-sm"
              >
                {dateLabel.format(istToInstant(date, 12 * 60))}
                <button
                  type="button"
                  onClick={() => setBlockedDates(blockedDates.filter((item) => item !== date))}
                  className="text-ink-muted hover:text-omr rounded-full p-1"
                  aria-label={`Unblock ${date}`}
                >
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="border-line rounded-[var(--radius-panel)] border border-dashed p-6 sm:p-8">
        <h2 className="text-xl font-bold">Preview</h2>
        <p className="text-ink-muted mt-2">
          The first {previewDuration}-minute slots aspirants would see right now.
        </p>
        {!isClient ? null : preview.length === 0 ? (
          <p className="text-ink-muted mt-4">No slots yet. Add weekly hours above.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {preview.map((group) => (
              <div key={group.dateKey}>
                <p className="font-semibold">
                  {dateLabel.format(istToInstant(group.dateKey, 12 * 60))}
                </p>
                <p className="text-ink-muted mt-1 text-sm">
                  {group.slots
                    .slice(0, 8)
                    .map((slot) =>
                      formatMinuteOfDay(
                        Math.round(
                          (slot.getTime() - istToInstant(group.dateKey, 0).getTime()) / 60000,
                        ),
                      ),
                    )
                    .join(", ")}
                  {group.slots.length > 8 ? ` and ${group.slots.length - 8} more` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Button type="submit" size="lg" disabled={pending || problems.length > 0}>
        {pending ? "Saving…" : "Save availability"}
      </Button>
    </form>
  );
}
