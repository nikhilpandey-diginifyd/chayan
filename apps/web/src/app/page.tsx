import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  FileText,
  IdCard,
  PlayCircle,
  ShieldCheck,
  Video,
  Wallet,
} from "lucide-react";
import { EXAMS } from "@chayan/shared";
import { AnswerSheetHero } from "@/components/home/answer-sheet-hero";
import { ButtonLink } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

const steps = [
  {
    title: "Pick a mentor for your exam and stage",
    text: "Filter by exam, stage, language and price. Every profile shows how we verified the mentor's result.",
  },
  {
    title: "Book a slot and pay securely",
    text: "Choose a 15, 30 or 60 minute session. Pay with UPI, card or net banking through Razorpay.",
  },
  {
    title: "Join the video call from your browser",
    text: "Talk one-to-one, share your screen or a photo of your answer copy, and leave with a clear plan.",
  },
] as const;

const verification = [
  "Official result or marksheet, matched against the published list",
  "Government ID and PAN, matched to the name on the result",
  "A short trial session with our team before the profile goes live",
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_32rem_at_85%_-10%,rgb(43_79_199/0.12),transparent_70%)]"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:pb-28">
          <div>
            <p className="border-seal/25 bg-seal-soft text-seal inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold">
              <BadgeCheck aria-hidden="true" className="size-4" />
              Mentors verified against official results
            </p>
            <h1 className="mt-5 max-w-xl text-[2.6rem] leading-[1.08] font-extrabold sm:text-6xl lg:text-[4.1rem]">
              Ask someone who has already cleared it.
            </h1>
            <p className="text-ink-muted mt-6 max-w-lg text-lg sm:text-xl">
              One-to-one video sessions with verified UPSC and SSC selected candidates. In Hindi,
              English or Hinglish, with sessions starting at ₹199.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/mentors" size="lg">
                Find a mentor
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

      <section aria-label="Exams we cover" className="border-line/70 border-y bg-white">
        <ul className="mx-auto flex max-w-6xl [scrollbar-width:none] items-center gap-x-8 gap-y-3 overflow-x-auto px-4 py-5 sm:flex-wrap sm:justify-center sm:px-6">
          {EXAMS.map((exam) => (
            <li key={exam.code} className="flex shrink-0 items-baseline gap-2 whitespace-nowrap">
              <span className="font-display font-bold">{exam.shortName}</span>
              <span className="text-ink-muted text-sm" lang="hi">
                {exam.nameHi}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section id="how-it-works" className="scroll-mt-20">
        <div className="reveal mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-24">
          <h2 className="text-3xl font-extrabold sm:text-4xl">How a session works</h2>
          <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            <div
              aria-hidden="true"
              className="border-omr/35 absolute top-5 right-[16%] left-[16%] hidden border-t-2 border-dashed md:block"
            />
            {steps.map((step, index) => {
              const Icon = [Video, CalendarCheck, BadgeCheck][index]!;
              return (
                <li key={step.title} className="relative">
                  <span className="border-omr text-omr relative grid size-10 place-items-center rounded-full border-2 bg-white font-semibold md:mx-auto">
                    {index + 1}
                  </span>
                  <div className="panel border-line bg-surface mt-5 rounded-[var(--radius-card)] border p-6">
                    <Icon aria-hidden="true" className="text-pen size-6" />
                    <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                    <p className="text-ink-muted mt-2">{step.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="bg-night relative overflow-hidden text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_24rem_at_15%_0%,rgb(43_79_199/0.35),transparent_70%)]"
        />
        <div className="reveal relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.1fr] md:py-24">
          <div>
            <h2 className="text-3xl font-extrabold sm:text-4xl">How we verify mentors</h2>
            <p className="mt-4 max-w-md text-lg text-white/75">
              Anyone can claim a rank. Our mentors prove it before they can take a single booking.
            </p>
          </div>
          <ul className="space-y-4">
            {verification.map((item, index) => {
              const Icon = [FileText, IdCard, Video][index]!;
              return (
                <li
                  key={item}
                  className="flex gap-4 rounded-[var(--radius-card)] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm"
                >
                  <span className="bg-seal/25 text-seal-soft grid size-10 shrink-0 place-items-center rounded-full">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <span className="pt-1.5 text-white/90">{item}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section>
        <div className="reveal mx-auto grid max-w-6xl gap-5 px-4 py-20 sm:px-6 md:grid-cols-3 md:py-24">
          <div className="card-link border-line bg-surface relative rounded-[var(--radius-card)] border p-6">
            <span className="bg-pen-soft text-pen grid size-11 place-items-center rounded-xl">
              <Video aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-3 text-xl font-bold">
              <Link href="/mentors" className="hover:text-pen after:absolute after:inset-0">
                Mentorship calls
              </Link>
            </h3>
            <p className="text-ink-muted mt-2">
              Strategy, answer writing, optional subject choice, DAF and interview preparation.
            </p>
          </div>
          <div className="card-link border-line bg-surface relative rounded-[var(--radius-card)] border p-6">
            <span className="bg-pen-soft text-pen grid size-11 place-items-center rounded-xl">
              <FileText aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-3 text-xl font-bold">
              <Link href="/papers" className="hover:text-pen after:absolute after:inset-0">
                Previous year papers
              </Link>
            </h3>
            <p className="text-ink-muted mt-2">
              UPSC and SSC question papers by year, shift and language, free to download.
            </p>
          </div>
          <div className="card-link border-line bg-surface relative rounded-[var(--radius-card)] border p-6">
            <span className="bg-pen-soft text-pen grid size-11 place-items-center rounded-xl">
              <PlayCircle aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-3 text-xl font-bold">
              <Link href="/videos" className="hover:text-pen after:absolute after:inset-0">
                Short prep videos
              </Link>
            </h3>
            <p className="text-ink-muted mt-2">
              Two to five minute lessons on topics that come up again and again.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="reveal mx-auto max-w-6xl scroll-mt-20 px-4 pb-20 sm:px-6">
        <div className="panel border-line bg-surface grid gap-8 rounded-[var(--radius-feature)] border p-8 sm:p-10 md:grid-cols-[0.8fr_1fr_1fr]">
          <h2 className="text-3xl font-extrabold">Pricing</h2>
          <p className="text-ink-muted max-w-lg">
            Each mentor sets their own price for 15, 30 and 60 minute sessions, usually{" "}
            {siteConfig.pricing.typicalSessionRange} per session. The price you see is the price you
            pay, including our platform fee. Previous year papers and short videos are free.
          </p>
          <p className="text-ink-muted max-w-lg">
            If a mentor does not join, you get a full refund automatically. You can cancel up to 12
            hours before a session for a full refund. See the{" "}
            <Link href="/refund-policy" className="text-pen underline underline-offset-4">
              refund and cancellation policy
            </Link>
            .
          </p>
        </div>
      </section>

      <section id="become-a-mentor" className="mx-auto max-w-6xl scroll-mt-20 px-4 sm:px-6">
        <div className="bg-night reveal relative overflow-hidden rounded-[var(--radius-feature)] px-6 py-14 text-white sm:px-14">
          <div
            aria-hidden="true"
            className="border-omr/40 absolute -top-16 -right-16 size-64 rounded-full border-[10px] opacity-60"
          />
          <div
            aria-hidden="true"
            className="bg-omr/25 absolute top-10 right-10 size-24 rounded-full blur-2xl"
          />
          <h2 className="max-w-2xl text-3xl font-extrabold">
            Cleared UPSC or SSC? Help the next batch and get paid for your time.
          </h2>
          <p className="mt-4 max-w-xl text-white/80">
            Set your own price and hours. We handle bookings, payments and video calls. Applying
            takes about 10 minutes: your result, a photo ID and a short note about how you prepared.
          </p>
          <Link
            href="/mentor/apply"
            className="text-ink hover:bg-pen-soft relative mt-8 inline-flex h-12 items-center rounded-[var(--radius-control)] bg-white px-6 text-lg font-semibold transition-[background-color,transform] duration-200 active:scale-[0.97]"
          >
            Apply as a mentor
          </Link>
        </div>
      </section>
    </>
  );
}
