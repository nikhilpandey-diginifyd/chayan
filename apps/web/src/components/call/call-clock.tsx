"use client";

import { useEffect, useState } from "react";

function format(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export function CallClock({
  startsAt,
  endsAt,
  closesAt,
}: {
  startsAt: string;
  endsAt: string;
  closesAt: string;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  if (now === null) return <p className="h-6" aria-hidden="true" />;

  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const close = new Date(closesAt).getTime();
  const text =
    now < start
      ? `Starts in ${format(start - now)}`
      : now < end
        ? `${format(end - now)} left`
        : `Time is up. The call closes in ${format(close - now)}`;
  const warn = now >= end - 5 * 60_000;
  return (
    <p className={warn ? "text-omr font-semibold" : "text-ink-muted"} role="timer" aria-live="off">
      {text}
    </p>
  );
}
