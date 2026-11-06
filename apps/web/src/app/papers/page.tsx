import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { EXAMS, PAPER_LANGUAGE_LABELS, PAPER_LANGUAGES } from "@chayan/shared";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { formatFileSize, listPaperYears, listPapers, parsePaperFilters } from "@/lib/content";

export const metadata: Metadata = {
  title: "UPSC and SSC previous year question papers (PDF)",
  description:
    "Free UPSC CSE and SSC previous year question papers by year, shift and language, with answer keys where available.",
  alternates: { canonical: "/papers" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PapersPage({ searchParams }: Props) {
  const filters = parsePaperFilters(await searchParams);
  const [papers, years] = await Promise.all([listPapers(filters), listPaperYears()]);
  const groups = EXAMS.map((exam) => ({
    exam,
    papers: papers.filter((paper) => paper.examCode === exam.code),
  })).filter((group) => group.papers.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Previous year papers</h1>
      <p className="text-ink-muted mt-3 max-w-prose">
        Official UPSC and SSC question papers, free to download with an account. Solving past papers
        is the fastest way to learn what each exam really asks.
      </p>

      <form
        method="get"
        className="border-line bg-surface mt-8 flex flex-wrap items-end gap-3 rounded-[var(--radius-panel)] border p-4"
      >
        <div className="min-w-40 flex-1">
          <label htmlFor="exam" className="text-sm font-semibold">
            Exam
          </label>
          <Select id="exam" name="exam" defaultValue={filters.exam ?? ""} className="mt-1">
            <option value="">All exams</option>
            {EXAMS.map((exam) => (
              <option key={exam.code} value={exam.code}>
                {exam.shortName}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-32">
          <label htmlFor="year" className="text-sm font-semibold">
            Year
          </label>
          <Select
            id="year"
            name="year"
            defaultValue={filters.year ? String(filters.year) : ""}
            className="mt-1"
          >
            <option value="">All years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </Select>
        </div>
        <div className="min-w-40">
          <label htmlFor="language" className="text-sm font-semibold">
            Language
          </label>
          <Select
            id="language"
            name="language"
            defaultValue={filters.language ?? ""}
            className="mt-1"
          >
            <option value="">Any language</option>
            {PAPER_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {PAPER_LANGUAGE_LABELS[language]}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit">Show papers</Button>
        {filters.exam || filters.year || filters.language ? (
          <Link href="/papers" className="text-pen pb-3 font-semibold">
            Clear
          </Link>
        ) : null}
      </form>

      {groups.length === 0 ? (
        <p className="text-ink-muted mt-10">
          No papers match these filters yet. New papers are added regularly.
        </p>
      ) : (
        <div className="mt-10 space-y-10">
          {groups.map((group) => (
            <section key={group.exam.code}>
              <h2 className="text-2xl font-bold">{group.exam.shortName}</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.papers.map((paper) => (
                  <li
                    key={paper.id}
                    className="border-line bg-surface hover:border-ink-muted relative flex gap-3 rounded-[var(--radius-control)] border p-4"
                  >
                    <FileText aria-hidden="true" className="text-pen mt-0.5 size-5 shrink-0" />
                    <div className="min-w-0">
                      <Link
                        href={`/papers/${paper.slug}`}
                        className="font-semibold after:absolute after:inset-0"
                      >
                        {paper.year}: {paper.title}
                      </Link>
                      <p className="text-ink-muted mt-1 text-sm">
                        {PAPER_LANGUAGE_LABELS[paper.language]} · PDF{" "}
                        {formatFileSize(paper.fileSizeBytes)}
                        {paper.hasAnswerKey ? " · answer key" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
