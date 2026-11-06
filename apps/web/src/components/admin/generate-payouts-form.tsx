"use client";

import { useActionState } from "react";
import { formatRupees } from "@chayan/shared";
import { createPayoutsAction, type GenerateState } from "@/app/admin/payouts/actions";
import { Button } from "@/components/ui/button";
import { FormMessage, Input } from "@/components/ui/field";

export function GeneratePayoutsForm({ defaultPeriodEnd }: { defaultPeriodEnd: string }) {
  const [state, formAction, pending] = useActionState<GenerateState, FormData>(
    createPayoutsAction,
    {},
  );
  return (
    <form action={formAction} className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="periodEnd" className="block text-sm font-semibold">
            Week ending (Sunday)
          </label>
          <Input
            id="periodEnd"
            name="periodEnd"
            type="date"
            defaultValue={defaultPeriodEnd}
            required
            className="mt-1 w-48"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create payouts"}
        </Button>
      </div>
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      {state.created !== undefined ? (
        <FormMessage tone={state.created > 0 ? "success" : "info"}>
          {state.created > 0
            ? `Created ${state.created} payout${state.created === 1 ? "" : "s"}.`
            : "No new payouts. Everything eligible is already included."}
          {state.skipped && state.skipped.length > 0 ? (
            <>
              {" "}
              Skipped because payout details are missing:{" "}
              {state.skipped
                .map((item) => `${item.name} (${formatRupees(item.amountPaise)})`)
                .join(", ")}
              .
            </>
          ) : null}
        </FormMessage>
      ) : null}
    </form>
  );
}
