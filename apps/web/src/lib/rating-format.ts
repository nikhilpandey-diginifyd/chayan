export function averageRatingText(sum: number, count: number): string {
  return count > 0 ? (Math.round((sum / count) * 10) / 10).toFixed(1) : "–";
}
