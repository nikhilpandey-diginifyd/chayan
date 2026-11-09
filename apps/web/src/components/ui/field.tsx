import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export const inputClassName =
  "block h-11 w-full rounded-[var(--radius-control)] border border-line bg-surface px-3 text-base text-ink shadow-[inset_0_1px_2px_rgb(40_44_63/0.04)] transition-[border-color,box-shadow] duration-150 placeholder:text-ink-muted/70 hover:border-ink-muted/40 focus-visible:border-pen focus-visible:shadow-[0_0_0_4px_rgb(239_99_17/0.14)] focus-visible:outline-none aria-invalid:border-omr aria-invalid:focus-visible:shadow-[0_0_0_4px_rgb(226_55_68/0.14)]";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputClassName, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputClassName, "pr-8", className)} {...props} />;
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-ink-muted text-sm">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-omr text-sm font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormMessage({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-omr/40 bg-omr-soft text-ink",
    success: "border-seal/40 bg-seal-soft text-ink",
    info: "border-line bg-paper text-ink",
  } as const;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "animate-[rise-in_320ms_var(--ease-out-soft)_both] rounded-[var(--radius-control)] border px-4 py-3 text-sm motion-reduce:animate-none",
        styles[tone],
      )}
    >
      {children}
    </div>
  );
}
