import { BadgeCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  EXAMS,
  FOCUS_AREA_LABELS,
  FOCUS_AREAS,
  MENTOR_BADGE_INFO,
  MENTOR_BADGES,
  PREP_LANGUAGE_LABELS,
  PREP_LANGUAGES,
} from "@chayan/shared";
import { MentorCard } from "@/components/directory/mentor-card";
import { FilterChips } from "@/components/page/filter-chips";
import { PageHero } from "@/components/page/page-hero";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import {
  listMentors,
  PAGE_SIZE,
  parseFilters,
  type DirectoryFilters,
} from "@/lib/mentor-directory";

export const metadata: Metadata = {
  title: "Find a mentor",
  description:
    "Browse verified UPSC and SSC selected candidates. Filter by exam, language and price, and book a one-to-one video session.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function pageHref(filters: DirectoryFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.exam) params.set("exam", filters.exam);
  if (filters.language) params.set("language", filters.language);
  if (filters.badge) params.set("badge", filters.badge);
  if (filters.focus) params.set("focus", filters.focus);
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.q) params.set("q", filters.q);
  if (filters.sort !== "recommended") params.set("sort", filters.sort);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/mentors?${query}` : "/mentors";
}

export default async function MentorsPage({ searchParams }: Props) {
  const filters = parseFilters(await searchParams);
  const { mentors, total } = await listMentors(filters);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const moreOpen = Boolean(
    filters.focus || filters.badge || filters.maxPrice || filters.sort !== "recommended",
  );
  const hasFilters = Boolean(
    filters.exam ||
    filters.language ||
    filters.badge ||
    filters.focus ||
    filters.maxPrice ||
    filters.q,
  );

  return (
    <>
      <PageHero
        icon={<BadgeCheck aria-hidden="true" className="size-4" />}
        eyebrow="Every result checked against official lists"
        title="Find a mentor"
        lines={[
          "Hindi medium mentor chahiye?",
          "Job ke saath clear karne wale?",
          "Interview face kar chuke log?",
          "Quant aur reasoning ke experts?",
        ]}
        description="Every mentor here proved their result with official documents before their profile went live."
      >
        <FilterChips
          id="mentor-exam"
          label="Filter by exam"
          chips={[
            { href: "/mentors", label: "All exams", active: !filters.exam },
            ...EXAMS.map((exam) => ({
              href: `/mentors?exam=${exam.code}`,
              label: exam.shortName,
              active: filters.exam === exam.code,
            })),
          ]}
        />
      </PageHero>
      <div className="relative mx-auto -mt-10 max-w-6xl px-4 pb-12 sm:px-6">
        <form
          method="get"
          className="border-line bg-surface panel rounded-[var(--radius-panel)] border p-4 shadow-[var(--shadow-raised)] sm:p-5"
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="q" className="text-sm font-semibold">
                Search
              </label>
              <Input
                id="q"
                name="q"
                type="search"
                placeholder="Name or topic"
                defaultValue={filters.q ?? ""}
                className="mt-1"
              />
            </div>
            <div>
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
            <div>
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
                {PREP_LANGUAGES.map((language) => (
                  <option key={language} value={language}>
                    {PREP_LANGUAGE_LABELS[language]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <details className="group mt-3" open={moreOpen}>
            <summary className="text-pen cursor-pointer text-sm font-semibold select-none">
              More filters
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="focus" className="text-sm font-semibold">
                  Help with
                </label>
                <Select id="focus" name="focus" defaultValue={filters.focus ?? ""} className="mt-1">
                  <option value="">Anything</option>
                  {FOCUS_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {FOCUS_AREA_LABELS[area]}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="badge" className="text-sm font-semibold">
                  Verified result
                </label>
                <Select id="badge" name="badge" defaultValue={filters.badge ?? ""} className="mt-1">
                  <option value="">Any result</option>
                  {MENTOR_BADGES.map((badge) => (
                    <option key={badge} value={badge}>
                      {MENTOR_BADGE_INFO[badge].label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="maxPrice" className="text-sm font-semibold">
                  Budget per session
                </label>
                <Select
                  id="maxPrice"
                  name="maxPrice"
                  defaultValue={filters.maxPrice ? String(filters.maxPrice) : ""}
                  className="mt-1"
                >
                  <option value="">Any price</option>
                  {[199, 299, 499, 799, 999, 1499].map((price) => (
                    <option key={price} value={price}>
                      Up to ₹{price.toLocaleString("en-IN")}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label htmlFor="sort" className="text-sm font-semibold">
                  Sort by
                </label>
                <Select id="sort" name="sort" defaultValue={filters.sort} className="mt-1">
                  <option value="recommended">Recommended</option>
                  <option value="top_rated">Top rated</option>
                  <option value="price_low">Price: low to high</option>
                  <option value="price_high">Price: high to low</option>
                  <option value="newest">Newest mentors</option>
                </Select>
              </div>
            </div>
          </details>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="submit">Show mentors</Button>
            {hasFilters ? (
              <Link href="/mentors" className="text-pen font-semibold">
                Clear filters
              </Link>
            ) : null}
          </div>
        </form>

        <p className="text-ink-muted mt-8" aria-live="polite">
          {total === 0
            ? "No mentors match these filters."
            : `${total} mentor${total === 1 ? "" : "s"}`}
        </p>

        {mentors.length > 0 ? (
          <ul className="stagger mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((mentor, index) => (
              <MentorCard key={mentor.userId} mentor={mentor} index={index} />
            ))}
          </ul>
        ) : (
          <div className="border-line mt-4 rounded-[var(--radius-panel)] border border-dashed bg-white/60 p-10 text-center">
            <p className="font-semibold">
              {hasFilters ? "Try removing a filter." : "Our first mentors are being verified."}
            </p>
            <p className="text-ink-muted mt-2">
              {hasFilters
                ? "Fewer filters usually shows more mentors."
                : "Check back soon. If you cleared UPSC or SSC, you can apply to mentor."}
            </p>
            {!hasFilters ? (
              <Link href="/mentor/apply" className="text-pen mt-4 inline-block font-semibold">
                Apply as a mentor
              </Link>
            ) : null}
          </div>
        )}

        {pages > 1 ? (
          <nav aria-label="Pages" className="mt-10 flex items-center justify-between">
            {filters.page > 1 ? (
              <Link href={pageHref(filters, filters.page - 1)} className="text-pen font-semibold">
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-ink-muted">
              Page {filters.page} of {pages}
            </span>
            {filters.page < pages ? (
              <Link href={pageHref(filters, filters.page + 1)} className="text-pen font-semibold">
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </>
  );
}
