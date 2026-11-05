"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function HoldCountdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(expiresAt).getTime();
    const tick = () => {
      const left = Math.max(0, Math.round((end - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) router.refresh();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [expiresAt, router]);

  if (secondsLeft === null) return <p className="h-6" aria-hidden="true" />;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  return (
    <p className="text-ink-muted text-center" role="timer" aria-live="off">
      Slot held for you for{" "}
      <strong className="text-ink">
        {minutes}:{seconds}
      </strong>
    </p>
  );
}
