import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  FileText,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Video,
  Wallet,
} from "lucide-react";
import { AnswerSheetHero } from "@/components/home/answer-sheet-hero";
import { ExamExplorer } from "@/components/home/exam-explorer";
import { ExamMarquee } from "@/components/home/exam-marquee";
import { Faq } from "@/components/home/faq";
import { RotatingHeadline } from "@/components/home/rotating-headline";
import { SessionJourney } from "@/components/home/session-journey";
import { SessionLengthPicker } from "@/components/home/session-length-picker";
import { VerifyChecklist } from "@/components/home/verify-checklist";
import { ButtonLink } from "@/components/ui/button";

const resources = [
  {
    icon: Video,
    title: "Mentorship calls",
    text: "Strategy, answer writing, optional subject choice, DAF and interview preparation, one-to-one.",
    href: "/mentors",
    cta: "Find a mentor",
  },
  {
    icon: FileText,
    title: "Previous year papers",
    text: "UPSC and SSC question papers by year, shift and language, with answer keys where available.",
    href: "/papers",
    cta: "Browse papers",
  },
  {
    icon: PlayCircle,
    title: "Short prep videos",
    text: "Two to five minute lessons on topics that come up again and again, from people who cleared.",
    href: "/videos",
    cta: "Watch videos",
  },
] as const;

const promises = [
  { icon: ShieldCheck, title: "Mentor didn't join?", text: "Full refund, automatically." },
  {
    icon: Wallet,
    title: "No subscription",
    text: "Pay per session with UPI, card or net banking.",
  },
  {
    icon: BadgeCheck,
    title: "Verified results",
    text: "Every mentor's result checked against the official list.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_32rem_at_85%_-10%,rgb(43_79_199/0.14),transparent_70%),radial-gradient(30rem_20rem_at_0%_100%,rgb(204_54_81/0.07),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-10 pb-24 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-28">
          <div>
            <p className="border-seal/25 bg-seal-soft text-seal inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold">
              <BadgeCheck aria-hidden="true" className="size-4" />
              Mentors verified against official results
            </p>
            <RotatingHeadline />
            <p className="text-ink-muted mt-6 max-w-lg text-lg sm:text-xl">
              One-to-one video sessions with verified UPSC and SSC selected candidates, in Hindi,
              English or Hinglish. Book in minutes, join from your browser.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/mentors" size="lg">
                Find a mentor
                <ArrowUpRight aria-hidden="true" className="size-5" />
              </ButtonLink>
              <ButtonLink href="/mentor/apply" variant="secondary" size="lg">
                Become a mentor
              </ButtonLink>
            </div>
            <ul className="text-ink-muted mt-9 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <li className="flex items-center gap-1.5">
                <ShieldCheck aria-hidden="true" className="text-seal size-4" />
                Full refund if your mentor doesn&apos;t join
              </li>
              <li className="flex items-center gap-1.5">
                <Wallet aria-hidden="true" className="text-pen size-4" />
                UPI, cards and net banking
              </li>
            </ul>
          </div>
          <AnswerSheetHero />
        </div>
      </section>

      <ExamMarquee />

      {/* Exam explorer */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
        <div className="reveal max-w-2xl">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Your exam, your stage</h2>
          <p className="text-ink-muted mt-3 text-lg">
            Every mentor cleared the stage they mentor for. Pick your exam to see who can help.
          </p>
        </div>
        <div className="mt-8">
          <ExamExplorer />
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="ruled-paper border-line/70 scroll-mt-20 border-y max-md:[background-image:none]"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <h2 className="text-3xl font-extrabold sm:text-4xl">How a session works</h2>
          <SessionJourney />
        </div>
      </section>

      {/* Verification */}
      <section className="bg-night relative overflow-hidden text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_24rem_at_15%_0%,rgb(43_79_199/0.4),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="border-seal/30 pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full border-[14px] opacity-40"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.15fr] md:py-24">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">How we verify mentors</h2>
            <p className="mt-4 max-w-md text-lg text-white/75">
              Anyone can claim a rank. Our mentors prove it before they can take a single booking.
            </p>
          </div>
          <VerifyChecklist />
        </div>
      </section>

      {/* Session lengths and promises */}
      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6 md:py-24">
        <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="reveal">
            <h2 className="text-3xl font-extrabold sm:text-4xl">Pricing</h2>
            <p className="text-ink-muted mt-3 text-lg">
              Pay for one session at a time. Choose the length that fits your question.
            </p>
            <ul className="mt-8 space-y-4">
              {promises.map((item) => (
                <li key={item.title} className="flex gap-4">
                  <span className="bg-pen-soft text-pen grid size-11 shrink-0 place-items-center rounded-xl">
                    <item.icon aria-hidden="true" className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{item.title}</span>
                    <span className="text-ink-muted">{item.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-ink-muted mt-8 text-sm">
              Cancel 12 hours or more before the start for a full refund. Details in our{" "}
              <Link href="/refund-policy" className="text-pen underline underline-offset-2">
                refund and cancellation policy
              </Link>
              .
            </p>
          </div>
          <SessionLengthPicker />
        </div>
      </section>

      {/* Free resources */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 md:pb-24">
        <div className="stagger grid gap-5 md:grid-cols-3">
          {resources.map((item, index) => (
            <div
              key={item.title}
              style={{ "--i": index } as React.CSSProperties}
              className="card-link border-line bg-surface group relative flex flex-col rounded-[var(--radius-card)] border p-6"
            >
              <span className="bg-pen-soft text-pen grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:-rotate-6">
                <item.icon aria-hidden="true" className="size-6" />
              </span>
              <h3 className="mt-4 text-xl font-bold">
                <Link href={item.href} className="after:absolute after:inset-0">
                  {item.title}
                </Link>
              </h3>
              <p className="text-ink-muted mt-2 flex-1">{item.text}</p>
              <span className="text-pen mt-5 inline-flex items-center gap-1 font-semibold">
                {item.cta}
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 md:pb-24">
        <h2 className="reveal text-center text-3xl font-extrabold sm:text-4xl">
          Questions aspirants ask
        </h2>
        <div className="mt-8">
          <Faq />
        </div>
      </section>

      {/* Become a mentor */}
      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="bg-night reveal relative overflow-hidden rounded-[var(--radius-feature)] px-6 py-14 text-white sm:px-14">
          <div
            aria-hidden="true"
            className="border-omr/40 absolute -top-16 -right-16 size-64 rounded-full border-[10px] opacity-60"
          />
          <div
            aria-hidden="true"
            className="bg-omr/25 absolute top-10 right-10 size-24 rounded-full blur-2xl"
          />
          <p className="relative inline-flex items-center gap-2 text-sm font-semibold text-white/80">
            <Sparkles aria-hidden="true" className="size-4" />
            For selected and interview-appeared candidates
          </p>
          <h2 className="relative mt-3 max-w-xl text-3xl font-extrabold sm:text-4xl">
            Cleared UPSC or SSC? Help the next batch and get paid for your time.
          </h2>
          <p className="relative mt-4 max-w-xl text-white/80">
            Set your own prices and hours. You keep 80% of every session, paid out weekly to your
            bank account or UPI.
          </p>
          <Link
            href="/mentor/apply"
            className="text-ink hover:bg-pen-soft relative mt-8 inline-flex h-12 items-center gap-2 rounded-[var(--radius-control)] bg-white px-6 text-lg font-semibold transition-[background-color,transform] duration-200 active:scale-[0.97]"
          >
            Apply as a mentor
            <ArrowUpRight aria-hidden="true" className="size-5" />
          </Link>
        </div>
      </section>
    </>
  );
}
