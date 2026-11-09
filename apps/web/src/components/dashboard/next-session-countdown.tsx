"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { ArrowUpRight, CalendarPlus, Video } from "lucide-react";

const JOIN_OPENS_MS = 10 * 60_000;

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function Digit({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, "0");
  return (
    <div className="text-center">
      <div className="bg-paper relative grid h-14 w-14 place-items-center overflow-hidden rounded-xl sm:h-16 sm:w-16">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={text}
            initial={{ y: "-60%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "60%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-ink text-2xl font-extrabold sm:text-3xl"
          >
            {text}
          </m.span>
        </AnimatePresence>
      </div>
      <p className="text-ink-muted mt-1 text-xs font-semibold">{label}</p>
    </div>
  );
}

/**
 * Countdown to the aspirant's next session. Turns into a pulsing
 * "Join the call" button once the call opens.
 */
export function NextSessionCountdown({
  session,
}: {
  session: { id: string; startsAt: string; mentorName: string; whenLabel: string } | null;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!session) {
    return (
      <div className="text-ink rounded-3xl bg-white p-6 shadow-[0_30px_60px_-24px_rgb(0_0_0/0.5)]">
        <span className="bg-pen-soft text-pen grid size-12 place-items-center rounded-2xl">
          <CalendarPlus aria-hidden="true" className="size-6" />
        </span>
        <p className="font-display mt-4 text-2xl font-bold">No session booked yet</p>
        <p className="text-ink-muted mt-1">Pehla step lo. 30 minutes can change your whole plan.</p>
        <Link
          href="/mentors"
          className="bg-pen hover:bg-pen-dark mt-5 inline-flex h-11 items-center gap-2 rounded-[var(--radius-control)] px-5 font-bold text-white transition-colors"
        >
          Find a mentor
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    );
  }

  const start = new Date(session.startsAt).getTime();
  const remaining = now === null ? null : start - now;
  const joinOpen = remaining !== null && remaining <= JOIN_OPENS_MS;
  const time = parts(remaining ?? 0);

  return (
    <div className="text-ink rounded-3xl bg-white p-6 shadow-[0_30px_60px_-24px_rgb(0_0_0/0.5)]">
      <p className="text-pen text-sm font-bold">Your next session</p>
      <p className="font-display mt-1 text-xl leading-snug font-bold">With {session.mentorName}</p>
      <p className="text-ink-muted text-sm">{session.whenLabel}</p>

      {joinOpen ? (
        <m.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-5"
        >
          <Link
            href={`/bookings/${session.id}/call`}
            className="bg-seal relative inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-control)] font-bold text-white"
          >
            <span
              aria-hidden="true"
              className="bg-seal absolute inset-0 animate-ping rounded-[var(--radius-control)] opacity-30 motion-reduce:hidden"
            />
            <Video aria-hidden="true" className="relative size-5" />
            <span className="relative">Join the call</span>
          </Link>
        </m.div>
      ) : (
        <div
          className="mt-5 flex justify-between gap-2"
          role="timer"
          aria-label="Time until your session"
        >
          <Digit value={time.days} label="days" />
          <Digit value={time.hours} label="hours" />
          <Digit value={time.minutes} label="min" />
          <Digit value={time.seconds} label="sec" />
        </div>
      )}
      <Link
        href={`/bookings/${session.id}`}
        className="text-pen mt-4 inline-flex items-center gap-1 text-sm font-semibold"
      >
        Booking details
        <ArrowUpRight aria-hidden="true" className="size-3.5" />
      </Link>
    </div>
  );
}
