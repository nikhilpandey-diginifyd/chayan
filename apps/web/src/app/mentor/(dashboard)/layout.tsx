import type { ReactNode } from "react";
import { MENTOR_BADGE_INFO } from "@chayan/shared";
import { MentorBanner } from "@/components/mentor/mentor-banner";
import { averageRatingText } from "@/lib/rating-format";
import { requireMentor } from "@/lib/mentor-profile";

export default async function MentorDashboardLayout({ children }: { children: ReactNode }) {
  const { user, mentor } = await requireMentor("/mentor");
  return (
    <>
      <MentorBanner
        name={user.name}
        badge={MENTOR_BADGE_INFO[mentor.badge].label}
        published={mentor.isPublished}
        slug={mentor.slug}
        rating={
          mentor.ratingCount > 0
            ? `${averageRatingText(mentor.ratingSum, mentor.ratingCount)} (${mentor.ratingCount})`
            : null
        }
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div>
    </>
  );
}
