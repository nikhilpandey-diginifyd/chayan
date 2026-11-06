import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { PAPER_LANGUAGE_LABELS } from "@chayan/shared";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { formatFileSize, getPaperBySlug, relatedPapers } from "@/lib/content";
import { getSession } from "@/lib/session";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const paper = await getPaperBySlug(slug);
  if (!paper) return { title: "Paper not found", robots: { index: false } };
  const title = `${paper.examShortName} ${paper.year} ${paper.title} question paper PDF`;
  return {
    title,
    description:
      paper.description ??
      `Download the ${paper.examShortName} ${paper.year} ${paper.title} question paper (${PAPER_LANGUAGE_LABELS[paper.language]}) as a PDF${paper.hasAnswerKey ? ", with the answer key" : ""}.`,
    alternates: { canonical: `/papers/${slug}` },
  };
}

export default async function PaperPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{2,90}$/.test(slug)) notFound();
  const paper = await getPaperBySlug(slug);
  if (!paper) notFound();
  const [session, related] = await Promise.all([
    getSession(),
    relatedPapers(paper.examId, paper.id),
  ]);
  const downloadHref = `/api/papers/${paper.id}/download`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/papers" className="text-pen font-semibold">
          Previous year papers
        </Link>
        <span className="text-ink-muted"> / </span>
        <Link href={`/papers?exam=${paper.examCode}`} className="text-pen font-semibold">
          {paper.examShortName}
        </Link>
      </nav>
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">
        {paper.examShortName} {paper.year}: {paper.title}
      </h1>
      <p className="text-ink-muted mt-3">
        {paper.examName} · {PAPER_LANGUAGE_LABELS[paper.language]} · PDF{" "}
        {formatFileSize(paper.fileSizeBytes)}
      </p>
      {paper.description ? (
        <p className="mt-6 max-w-prose whitespace-pre-line">{paper.description}</p>
      ) : null}

      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6">
        {session ? (
          <div className="flex flex-wrap gap-3">
            <a href={downloadHref} className={buttonVariants({ size: "lg" })}>
              <Download aria-hidden="true" className="size-5" />
              Download question paper
            </a>
            {paper.hasAnswerKey ? (
              <a
                href={`${downloadHref}?file=answer-key`}
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                <FileText aria-hidden="true" className="size-5" />
                Download answer key
              </a>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="font-semibold">Free with an account</p>
            <p className="text-ink-muted">
              Sign in or create a free account to download this paper
              {paper.hasAnswerKey ? " and its answer key" : ""}.
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`/sign-up?next=${encodeURIComponent(`/papers/${slug}`)}`}>
                Create a free account
              </ButtonLink>
              <ButtonLink
                href={`/sign-in?next=${encodeURIComponent(`/papers/${slug}`)}`}
                variant="secondary"
              >
                Sign in
              </ButtonLink>
            </div>
          </div>
        )}
        {paper.sourceUrl ? (
          <p className="text-ink-muted mt-4 text-sm">
            Source:{" "}
            <a
              href={paper.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-pen underline underline-offset-2"
            >
              official website
            </a>
          </p>
        ) : null}
      </section>

      <section className="border-line bg-ink mt-8 rounded-[var(--radius-panel)] border p-6 text-white">
        <h2 className="text-xl font-bold">Solved it? Get it reviewed.</h2>
        <p className="mt-2 max-w-prose text-white/80">
          Book a one-to-one session with a verified {paper.examShortName} selectee to go through
          your answers and plan your next steps.
        </p>
        <Link
          href={`/mentors?exam=${paper.examCode}`}
          className="text-ink mt-4 inline-flex h-11 items-center rounded-[var(--radius-control)] bg-white px-5 font-semibold"
        >
          Find a {paper.examShortName} mentor
        </Link>
      </section>

      {related.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold">More {paper.examShortName} papers</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {related.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/papers/${item.slug}`}
                  className="border-line bg-surface hover:border-ink-muted block rounded-[var(--radius-control)] border p-4 font-semibold"
                >
                  {item.year}: {item.title}
                  <span className="text-ink-muted block text-sm font-normal">
                    {PAPER_LANGUAGE_LABELS[item.language]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
