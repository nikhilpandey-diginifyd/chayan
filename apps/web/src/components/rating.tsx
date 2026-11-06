import { Star } from "lucide-react";
import { averageRatingText } from "@/lib/rating-format";

export function RatingBadge({
  sum,
  count,
  size = "sm",
}: {
  sum: number;
  count: number;
  size?: "sm" | "lg";
}) {
  if (count === 0) {
    return <span className="text-ink-muted text-sm">New mentor</span>;
  }
  return (
    <span
      className={
        size === "lg"
          ? "inline-flex items-center gap-1.5 text-base"
          : "inline-flex items-center gap-1 text-sm"
      }
    >
      <Star
        aria-hidden="true"
        className={size === "lg" ? "fill-omr text-omr size-5" : "fill-omr text-omr size-4"}
      />
      <span className="font-semibold">{averageRatingText(sum, count)}</span>
      <span className="text-ink-muted">
        ({count} review{count === 1 ? "" : "s"})
      </span>
    </span>
  );
}
