import { cn } from "@/lib/utils";

const labels: Record<string, { text: string; tone: string }> = {
  pending_payment: { text: "Awaiting payment", tone: "border-line bg-paper text-ink-muted" },
  confirmed: { text: "Confirmed", tone: "border-seal/30 bg-seal-soft text-seal" },
  cancelled_by_aspirant: { text: "Cancelled", tone: "border-line bg-paper text-ink-muted" },
  cancelled_by_mentor: { text: "Cancelled by mentor", tone: "border-omr/30 bg-omr-soft text-omr" },
  expired: { text: "Not paid", tone: "border-line bg-paper text-ink-muted" },
  completed: { text: "Completed", tone: "border-line bg-paper text-ink" },
};

export function BookingStatusBadge({ status }: { status: string }) {
  const label = labels[status] ?? { text: status, tone: "border-line bg-paper" };
  return (
    <span
      className={cn(
        "inline-block rounded-full border px-3 py-0.5 text-sm font-semibold",
        label.tone,
      )}
    >
      {label.text}
    </span>
  );
}
