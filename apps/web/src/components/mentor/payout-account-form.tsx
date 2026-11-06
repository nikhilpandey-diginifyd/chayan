"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  saveMentorPayoutAccount,
  type PayoutAccountState,
} from "@/app/mentor/(dashboard)/earnings/actions";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/lib/use-hydrated";
import { Field, FormMessage, Input } from "@/components/ui/field";

type Saved = {
  method: "bank" | "upi";
  accountHolderName: string;
  accountNumberLast4: string | null;
  ifsc: string | null;
  upiIdMasked: string | null;
  panLast4: string;
} | null;

export function PayoutAccountSection({ saved }: { saved: Saved }) {
  const [editing, setEditing] = useState(!saved);
  const [justSaved, setJustSaved] = useState(false);

  if (saved && !editing) {
    return (
      <div className="space-y-3">
        {justSaved ? <FormMessage tone="success">Payout details saved.</FormMessage> : null}
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted text-sm">Paid to</dt>
            <dd className="font-semibold">
              {saved.method === "bank"
                ? `Bank account ending ${saved.accountNumberLast4} (${saved.ifsc})`
                : `UPI ${saved.upiIdMasked}`}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted text-sm">Name</dt>
            <dd className="font-semibold">{saved.accountHolderName}</dd>
          </div>
          <div>
            <dt className="text-ink-muted text-sm">PAN</dt>
            <dd className="font-semibold">Ending {saved.panLast4}</dd>
          </div>
        </dl>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            setJustSaved(false);
            setEditing(true);
          }}
        >
          Change payout details
        </Button>
      </div>
    );
  }

  return (
    <PayoutAccountForm
      initialMethod={saved?.method ?? "bank"}
      onSaved={() => {
        setJustSaved(true);
        setEditing(false);
      }}
      onCancel={saved ? () => setEditing(false) : undefined}
    />
  );
}

function PayoutAccountForm({
  initialMethod,
  onSaved,
  onCancel,
}: {
  initialMethod: "bank" | "upi";
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const hydrated = useHydrated();
  const [method, setMethod] = useState(initialMethod);
  const [state, setState] = useState<PayoutAccountState>({});
  const [pending, startTransition] = useTransition();
  const errors = state.fieldErrors ?? {};

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveMentorPayoutAccount({}, formData);
      setState(result);
      if (result.saved) onSaved();
    });
  }

  return (
    <form method="post" onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
      {state.error ? <FormMessage tone="error">{state.error}</FormMessage> : null}
      <fieldset>
        <legend className="text-sm font-semibold">How should we pay you?</legend>
        <div className="mt-2 flex gap-6">
          {(["bank", "upi"] as const).map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input
                type="radio"
                name="method"
                value={option}
                checked={method === option}
                onChange={() => setMethod(option)}
                className="accent-pen size-4"
              />
              {option === "bank" ? "Bank transfer" : "UPI"}
            </label>
          ))}
        </div>
      </fieldset>

      <Field
        id="accountHolderName"
        label={method === "bank" ? "Account holder name" : "Full name (as on PAN)"}
        error={errors.accountHolderName}
      >
        <Input
          id="accountHolderName"
          name="accountHolderName"
          required
          aria-invalid={Boolean(errors.accountHolderName)}
        />
      </Field>

      {method === "bank" ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="accountNumber" label="Account number" error={errors.accountNumber}>
            <Input
              id="accountNumber"
              name="accountNumber"
              inputMode="numeric"
              required
              aria-invalid={Boolean(errors.accountNumber)}
            />
          </Field>
          <Field
            id="confirmAccountNumber"
            label="Confirm account number"
            error={errors.confirmAccountNumber}
          >
            <Input
              id="confirmAccountNumber"
              name="confirmAccountNumber"
              inputMode="numeric"
              required
              aria-invalid={Boolean(errors.confirmAccountNumber)}
            />
          </Field>
          <Field id="ifsc" label="IFSC" error={errors.ifsc}>
            <Input
              id="ifsc"
              name="ifsc"
              required
              maxLength={11}
              className="uppercase"
              aria-invalid={Boolean(errors.ifsc)}
            />
          </Field>
        </div>
      ) : (
        <Field id="upiId" label="UPI ID" error={errors.upiId}>
          <Input
            id="upiId"
            name="upiId"
            required
            placeholder="name@okaxis"
            aria-invalid={Boolean(errors.upiId)}
          />
        </Field>
      )}

      <Field
        id="pan"
        label="PAN"
        hint="Needed by law to deduct tax at source (TDS) on your earnings. Without it, tax is deducted at 5%."
        error={errors.pan}
      >
        <Input
          id="pan"
          name="pan"
          required
          maxLength={10}
          className="uppercase sm:w-60"
          aria-invalid={Boolean(errors.pan)}
        />
      </Field>

      <p className="text-ink-muted text-sm">
        We encrypt your account number, UPI ID and PAN. Only our finance team can see them, to send
        your payouts and file tax returns.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={!hydrated || pending}>
          {pending ? "Saving…" : "Save payout details"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
