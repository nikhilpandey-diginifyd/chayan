"use client";

import { useMemo, useState } from "react";
import { formatRupees, groupSlotsByIstDate, formatMinuteOfDay } from "@chayan/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatIstDay, minuteOfIstDay } from "./format";

type Option = { durationMinutes: number; pricePaise: number; slots: string[] };

export function SlotPicker({ options }: { options: Option[] }) {
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

      <div>
        <Button type="button" className="w-full" disabled>
          {slot ? `Book for ${formatRupees(selected.pricePaise)}` : "Choose a time"}
        </Button>
        <p className="text-ink-muted mt-2 text-center text-sm">Online booking opens very soon.</p>
      </div>
    </div>
  );
}
