"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { CalendarClock, ClipboardCheck, ShieldCheck, Wallet } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { CountUp } from "@/components/ui/count-up";

const timeFormat = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "Asia/Kolkata",
});

/** Dark "control room" banner across admin pages: live IST clock, work waiting, tabs. */
export function AdminBanner({
  pendingApplications,
  pendingPayouts,
  sessionsToday,
}: {
  pendingApplications: number;
  pendingPayouts: number;
  sessionsToday: number;
}) {
  const reduce = useReducedMotion();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const tiles = [
    {
      icon: ClipboardCheck,
      label: "Applications to review",
      value: pendingApplications,
      urgent: pendingApplications > 0,
    },
    { icon: Wallet, label: "Payouts to send", value: pendingPayouts, urgent: pendingPayouts > 0 },
    { icon: CalendarClock, label: "Sessions today", value: sessionsToday, urgent: false },
  ];

  return (
    <section className="bg-night relative isolate overflow-hidden text-white">
      <div
        aria-hidden="true"
        className="bg-saffron/25 absolute -top-40 -right-24 -z-10 size-[28rem] rounded-full blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.07]"
      />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <p className="text-saffron inline-flex items-center gap-2 text-sm font-bold">
              <ShieldCheck aria-hidden="true" className="size-4" />
              Admin control room
            </p>
            <p className="font-display mt-1 text-3xl font-extrabold tabular-nums sm:text-4xl">
              {now ? timeFormat.format(now) : "\u00a0"}
              <span className="ml-2 text-base font-semibold text-white/60">IST</span>
            </p>
          </m.div>
          <ul className="grid w-full grid-cols-3 gap-2 sm:w-auto sm:gap-3">
            {tiles.map((tile, index) => (
              <m.li
                key={tile.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-3 backdrop-blur sm:min-w-36 sm:p-4"
              >
                {tile.urgent && !reduce ? (
                  <span
                    aria-hidden="true"
                    className="bg-saffron absolute top-3 right-3 size-2 animate-ping rounded-full"
                  />
                ) : null}
                {tile.urgent ? (
                  <span
                    aria-hidden="true"
                    className="bg-saffron absolute top-3 right-3 size-2 rounded-full"
                  />
                ) : null}
                <tile.icon aria-hidden="true" className="text-saffron size-5" />
                <p className="font-display mt-2 text-2xl font-extrabold">
                  <CountUp value={tile.value} />
                </p>
                <p className="text-xs leading-tight text-white/70 sm:text-sm">{tile.label}</p>
              </m.li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <AdminNav tone="dark" />
        </div>
      </div>
    </section>
  );
}
