"use client";

import { useActionState, useState } from "react";
import {
  formatRupees,
  mentorEarningsPaise,
  SESSION_DURATIONS,
  SESSION_PRICE_LIMITS,
} from "@chayan/shared";
import { saveMentorServices, type FormState } from "@/app/mentor/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Input } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Row = { durationMinutes: number; rupees: number; isActive: boolean };

const suggestions: Record<number, string> = {
  15: "Quick doubt or form-filling question",
  30: "Strategy check-in or answer review",
  60: "Full strategy plan or mock interview",
};

export function ServicesForm({ initial }: { initial: Row[] }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(saveMentorServices, {});
  const [rows, setRows] = useState(() =>
    SESSION_DURATIONS.map((duration) => {
      const existing = initial.find((row) => row.durationMinutes === duration);
      return {
        duration,
        enabled: existing?.isActive ?? false,
        price: existing ? String(existing.rupees) : "",
      };
    }),
  );
  const errors = state.fieldErrors ?? {};

  function update(index: number, patch: Partial<(typeof rows)[number]>) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state.saved ? <FormMessage tone="success">Prices saved.</FormMessage> : null}
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}

      <ul className="divide-line divide-y">
        {rows.map((row, index) => {
          const rupees = Number(row.price);
          const valid =
            Number.isInteger(rupees) &&
            rupees >= SESSION_PRICE_LIMITS.minRupees &&
            rupees <= SESSION_PRICE_LIMITS.maxRupees;
          const error = errors[`price_${row.duration}`];
          return (
            <li key={row.duration} className="flex flex-wrap items-start gap-4 py-5">
              <label className="flex min-w-48 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  name={`enabled_${row.duration}`}
                  checked={row.enabled}
                  onChange={(event) => update(index, { enabled: event.target.checked })}
                  className="accent-pen mt-1 size-4 shrink-0"
                />
                <span>
                  <span className="block font-semibold">{row.duration} minute session</span>
                  <span className="text-ink-muted block text-sm">{suggestions[row.duration]}</span>
                </span>
              </label>
              <div className={cn("w-40", !row.enabled && "opacity-50")}>
                <label htmlFor={`price_${row.duration}`} className="sr-only">
                  Price for {row.duration} minutes in rupees
                </label>
                <div className="relative">
                  <span className="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2">
                    ₹
                  </span>
                  <Input
                    id={`price_${row.duration}`}
                    name={`price_${row.duration}`}
                    inputMode="numeric"
                    value={row.price}
                    disabled={!row.enabled}
                    onChange={(event) =>
                      update(index, { price: event.target.value.replace(/\D/g, "") })
                    }
                    aria-invalid={Boolean(error)}
                    className="pl-7"
                  />
                </div>
                {row.enabled && valid ? (
                  <p className="text-ink-muted mt-1 text-sm">
                    You get {formatRupees(mentorEarningsPaise(rupees * 100))}
                  </p>
                ) : null}
                {error ? <p className="text-omr mt-1 text-sm font-medium">{error}</p> : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-ink-muted text-sm">
        Prices from ₹{SESSION_PRICE_LIMITS.minRupees} to ₹
        {SESSION_PRICE_LIMITS.maxRupees.toLocaleString("en-IN")} per session. Most mentors start
        between ₹199 and ₹999.
      </p>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save prices"}
      </Button>
    </form>
  );
}
