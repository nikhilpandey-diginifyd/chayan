import type { Metadata } from "next";
import Link from "next/link";
import { aliasedTable, desc, eq, reviews, users } from "@chayan/db";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { toggleReviewVisibility } from "./actions";

export const metadata: Metadata = { title: "Reviews", robots: { index: false } };

const mentorUser = aliasedTable(users, "mentor_user");
const aspirantUser = aliasedTable(users, "aspirant_user");
const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

export default async function AdminReviewsPage() {
  await requireRole(["admin"], "/admin/reviews");
  const rows = await getDb()
    .select({
      id: reviews.id,
      bookingId: reviews.bookingId,
      rating: reviews.rating,
      comment: reviews.comment,
      mentorOnCamera: reviews.mentorOnCamera,
      isHidden: reviews.isHidden,
      hiddenReason: reviews.hiddenReason,
      createdAt: reviews.createdAt,
      mentor: mentorUser.name,
      aspirant: aspirantUser.name,
    })
    .from(reviews)
    .innerJoin(mentorUser, eq(mentorUser.id, reviews.mentorUserId))
    .innerJoin(aspirantUser, eq(aspirantUser.id, reviews.aspirantUserId))
    .orderBy(desc(reviews.createdAt))
    .limit(100);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-extrabold">Reviews</h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        Hide reviews that are abusive, share personal contact details or aren&apos;t about the
        session. Hidden reviews don&apos;t count towards the mentor&apos;s rating.
      </p>
      {rows.length === 0 ? (
        <p className="text-ink-muted mt-8">No reviews yet.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className={`bg-surface rounded-[var(--radius-control)] border p-4 ${row.isHidden ? "border-omr/40 opacity-75" : "border-line"}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {row.rating}/5 for {row.mentor}{" "}
                    <span className="text-ink-muted font-normal">
                      by {row.aspirant}, {dateFormat.format(row.createdAt)}
                    </span>
                  </p>
                  {row.mentorOnCamera ? (
                    <p className="text-ink-muted text-sm">Mentor on camera: {row.mentorOnCamera}</p>
                  ) : null}
                  {row.comment ? <p className="mt-2 whitespace-pre-line">{row.comment}</p> : null}
                  {row.isHidden ? (
                    <p className="text-omr mt-2 text-sm font-semibold">
                      Hidden{row.hiddenReason ? `: ${row.hiddenReason}` : ""}
                    </p>
                  ) : null}
                  <Link
                    href={`/bookings/${row.bookingId}`}
                    className="text-pen mt-2 inline-block text-sm font-semibold"
                  >
                    Open booking
                  </Link>
                </div>
                <form action={toggleReviewVisibility} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="reviewId" value={row.id} />
                  <input type="hidden" name="hide" value={row.isHidden ? "false" : "true"} />
                  {!row.isHidden ? (
                    <input
                      name="reason"
                      placeholder="Reason (internal)"
                      aria-label="Reason for hiding"
                      className="border-line h-9 rounded-[var(--radius-control)] border px-2 text-sm"
                    />
                  ) : null}
                  <Button type="submit" variant="secondary" size="sm">
                    {row.isHidden ? "Show again" : "Hide"}
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
