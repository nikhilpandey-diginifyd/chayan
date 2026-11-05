"use client";

import { useActionState, useMemo, useState } from "react";
import { formatMinuteOfDay, formatRupees, groupSlotsByIstDate } from "@chayan/shared";
import {
  cancelBookingAction,
  rescheduleBookingAction,
  type BookingActionState,
} from "@/app/bookings/[id]/actions";
import { formatIstDay, minuteOfIstDay } from "@/components/directory/format";
import { Button } from "@/components/ui/button";
import { FormMessage, inputClassName } from "@/components/ui/field";
import { cn } from "@/lib/utils";

export function CancelBookingForm({
  bookingId,
  actor,
  refundPaise,
  pricePaise,
}: {
  bookingId: string;
  actor: "aspirant" | "mentor" | "admin";
  refundPaise: number;
  pricePaise: number;
}) {
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    cancelBookingAction,
    {},
  );
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Cancel session
      </Button>
    );
  }

  const refundText =
    refundPaise === pricePaise
      ? `${actor === "aspirant" ? "You" : "The aspirant"} will get a full refund of ${formatRupees(refundPaise)}.`
      : refundPaise > 0
        ? `You'll get ${formatRupees(refundPaise)} back (50%) because it's less than 12 hours before the session.`
        : "No refund applies because the session has started.";

  return (
    <form
      action={formAction}
      className="border-omr/40 bg-omr-soft space-y-4 rounded-[var(--radius-control)] border p-4"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <p className="font-semibold">Cancel this session?</p>
      <p className="text-sm">{refundText}</p>
      <div>
        <label htmlFor="reason" className="text-sm font-semibold">
          {actor === "mentor" ? "Reason (the aspirant sees this)" : "Reason (optional)"}
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={2}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={cn(inputClassName, "bg-surface mt-1 h-auto py-2 text-sm")}
        />
      </div>
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Cancelling…" : "Yes, cancel"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Keep it
        </Button>
      </div>
    </form>
  );
}

export function RescheduleForm({ bookingId, slots }: { bookingId: string; slots: string[] }) {
  const [state, formAction, pending] = useActionState<BookingActionState, FormData>(
    rescheduleBookingAction,
    {},
  );
  const [open, setOpen] = useState(false);
  const days = useMemo(() => groupSlotsByIstDate(slots.map((slot) => new Date(slot))), [slots]);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const activeDay = days.find((day) => day.dateKey === dateKey) ?? days[0];

  if (!open) {
    return (
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Move to another time
      </Button>
    );
  }

  return (
    <form
      action={formAction}
      className="border-line bg-paper space-y-4 rounded-[var(--radius-control)] border p-4"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="startsAt" value={slot ?? ""} />
      <p className="font-semibold">Pick a new time (IST). You can move a booking once.</p>
      {days.length === 0 ? (
        <p className="text-ink-muted text-sm">The mentor has no other free times right now.</p>
      ) : (
        <>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {days.map((day) => (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => {
                  setDateKey(day.dateKey);
                  setSlot(null);
                }}
                className={cn(
                  "bg-surface shrink-0 rounded-[var(--radius-control)] border px-3 py-2 text-sm whitespace-nowrap",
                  day.dateKey === activeDay?.dateKey ? "border-pen ring-pen ring-1" : "border-line",
                )}
              >
                {formatIstDay(day.dateKey)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {activeDay?.slots.map((instant) => {
              const iso = instant.toISOString();
              return (
                <button
                  key={iso}
                  type="button"
                  aria-pressed={slot === iso}
                  onClick={() => setSlot(iso)}
                  className={cn(
                    "rounded-[var(--radius-control)] border px-2 py-2 text-sm",
                    slot === iso
                      ? "border-pen bg-pen font-semibold text-white"
                      : "border-line bg-surface",
                  )}
                >
                  {formatMinuteOfDay(minuteOfIstDay(instant))}
                </button>
              );
            })}
          </div>
        </>
      )}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!slot || pending}>
          {pending ? "Moving…" : "Move session"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Never mind
        </Button>
      </div>
    </form>
  );
}
