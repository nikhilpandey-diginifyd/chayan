import Link from "next/link";
import { BadgeCheck, CalendarClock } from "lucide-react";
import {
  FOCUS_AREA_LABELS,
  formatRupees,
  MENTOR_BADGE_INFO,
  PREP_LANGUAGE_LABELS,
  type FocusArea,
  type MentorBadge,
  type PrepLanguage,
} from "@chayan/shared";
import { Avatar } from "@/components/mentor/avatar";
import { RatingBadge } from "@/components/rating";
import { photoUrl } from "@/lib/mentor-profile";
import { formatSlotShort } from "./format";

export type MentorCardData = {
  slug: string | null;
  name: string;
  headline: string | null;
  photoKey: string | null;
  badge: MentorBadge;
  examShortName: string;
  examYear: number;
  rank: string | null;
  languages: PrepLanguage[];
  focusAreas: FocusArea[];
  minPricePaise: number;
  nextSlot: Date | null;
  ratingSum: number;
  ratingCount: number;
};

export function MentorCard({ mentor }: { mentor: MentorCardData }) {
  return (
    <li className="border-line bg-surface hover:border-ink-muted relative flex flex-col rounded-[var(--radius-panel)] border p-5 transition-colors">
      <div className="flex items-start gap-4">
        <Avatar name={mentor.name} url={photoUrl(mentor.photoKey)} size={64} />
        <div className="min-w-0">
          <h2 className="text-lg font-bold">
            <Link href={`/mentors/${mentor.slug}`} className="after:absolute after:inset-0">
              {mentor.name}
            </Link>
          </h2>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="text-seal inline-flex items-center gap-1 font-semibold">
              <BadgeCheck aria-hidden="true" className="size-4" />
              {MENTOR_BADGE_INFO[mentor.badge].label}
            </span>
            <span className="text-ink-muted">
              {mentor.examShortName} {mentor.examYear}
              {mentor.rank ? `, ${mentor.rank}` : ""}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-3">
        <RatingBadge sum={mentor.ratingSum} count={mentor.ratingCount} />
      </div>

      {mentor.headline ? <p className="mt-4 line-clamp-2">{mentor.headline}</p> : null}

      {mentor.focusAreas.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Helps with">
          {mentor.focusAreas.slice(0, 3).map((area) => (
            <li key={area} className="bg-paper text-ink-muted rounded-full px-2.5 py-0.5 text-xs">
              {FOCUS_AREA_LABELS[area]}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-5">
        <p className="text-ink-muted text-sm">
          {mentor.languages.map((language) => PREP_LANGUAGE_LABELS[language]).join(", ")}
        </p>
        <div className="border-line mt-2 flex items-end justify-between gap-3 border-t pt-3">
          <p className="text-ink-muted flex items-center gap-1.5 text-sm">
            <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
            {mentor.nextSlot ? formatSlotShort(mentor.nextSlot) : "No free slots soon"}
          </p>
          <p className="text-right">
            <span className="text-ink-muted block text-xs">from</span>
            <span className="font-bold">{formatRupees(mentor.minPricePaise)}</span>
          </p>
        </div>
      </div>
    </li>
  );
}
