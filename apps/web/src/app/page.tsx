import Link from "next/link";
import { BadgeCheck, FileText, PlayCircle, Video } from "lucide-react";
import { EXAMS } from "@chayan/shared";
import { OmrQuestion } from "@/components/omr-question";
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
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20">
        <div>
          <h1 className="max-w-xl text-4xl font-extrabold sm:text-5xl lg:text-6xl">
            Ask someone who has already cleared it.
          </h1>
          <p className="text-ink-muted mt-6 max-w-lg text-lg">
            One-to-one video sessions with verified UPSC and SSC selected candidates. In Hindi,
            English or Hinglish, with sessions starting at ₹199.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/sign-up" size="lg">
              Create a free account
            </ButtonLink>
            <ButtonLink href="#become-a-mentor" variant="secondary" size="lg">
              Become a mentor
            </ButtonLink>
          </div>
        </div>
        <OmrQuestion />
      </section>

      <section id="how-it-works" className="border-line bg-surface scroll-mt-20 border-y">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-extrabold">How a session works</h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title}>
                <span className="border-omr text-omr grid size-10 place-items-center rounded-full border-2 font-semibold">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold">{step.title}</h3>
                <p className="text-ink-muted mt-2">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-extrabold">Exams we cover</h2>
          <p className="text-ink-muted mt-3 max-w-md">
            We focus only on UPSC Civil Services and SSC, so every mentor knows your exam in detail.
          </p>
          <ul className="divide-line border-line mt-6 divide-y border-y">
            {EXAMS.map((exam) => (
              <li key={exam.code} className="flex items-baseline justify-between gap-4 py-3">
                <span className="shrink-0 font-semibold whitespace-nowrap">{exam.shortName}</span>
                <span className="text-ink-muted text-right text-sm" lang="hi">
                  {exam.nameHi}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold">How we verify mentors</h2>
          <p className="text-ink-muted mt-3 max-w-md">
            Anyone can claim a rank. Our mentors prove it before they can take a single booking.
          </p>
          <ul className="mt-6 space-y-4">
            {verification.map((item) => (
              <li key={item} className="flex gap-3">
                <BadgeCheck aria-hidden="true" className="text-seal mt-0.5 size-6 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-line bg-surface border-y">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
          <div>
            <Video aria-hidden="true" className="text-pen size-7" />
            <h3 className="mt-3 text-xl font-bold">Mentorship calls</h3>
            <p className="text-ink-muted mt-2">
              Strategy, answer writing, optional subject choice, DAF and interview preparation.
            </p>
          </div>
          <div>
            <FileText aria-hidden="true" className="text-pen size-7" />
            <h3 className="mt-3 text-xl font-bold">Previous year papers</h3>
            <p className="text-ink-muted mt-2">
              UPSC and SSC question papers by year, shift and language, free to download.
            </p>
          </div>
          <div>
            <PlayCircle aria-hidden="true" className="text-pen size-7" />
            <h3 className="mt-3 text-xl font-bold">Short prep videos</h3>
            <p className="text-ink-muted mt-2">
              Two to five minute lessons on topics that come up again and again.
            </p>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-extrabold">Pricing</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
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
        <div className="bg-ink rounded-[var(--radius-panel)] px-6 py-12 text-white sm:px-12">
          <h2 className="max-w-2xl text-3xl font-extrabold">
            Cleared UPSC or SSC? Help the next batch and get paid for your time.
          </h2>
          <p className="mt-4 max-w-xl text-white/80">
            Set your own price and hours. We handle bookings, payments and video calls. Mentor
            applications open soon. Write to us to join the first group of mentors.
          </p>
          <a
            href={`mailto:${siteConfig.business.email}?subject=Mentor%20application`}
            className="text-ink hover:bg-paper mt-8 inline-flex h-12 items-center rounded-[var(--radius-control)] bg-white px-6 text-lg font-semibold"
          >
            Email us to apply
          </a>
        </div>
      </section>
    </>
  );
}
