import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, exams, mentorApplications, users } from "@chayan/db";
import {
  MENTOR_APPLICATION_STATUSES,
  MENTOR_APPLICATION_STATUS_LABELS,
  MENTOR_BADGE_INFO,
  type MentorApplicationStatus,
} from "@chayan/shared";
import { FormMessage } from "@/components/ui/field";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Mentor applications", robots: { index: false } };

const tabs: MentorApplicationStatus[] = [
  "submitted",
  "changes_requested",
  "approved",
  "rejected",
  "draft",
];

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

function waitingFor(since: Date) {
  const hours = Math.floor((Date.now() - since.getTime()) / 3_600_000);
  if (hours < 1) return "under an hour";
  if (hours < 48) return `${hours} h`;
  return `${Math.floor(hours / 24)} days`;
}

const doneMessages: Record<string, string> = {
  approve: "Application approved. The mentor has been emailed.",
  request_changes: "Changes requested. The applicant has been emailed.",
  reject: "Application rejected. The applicant has been emailed.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MentorApplicationsPage({ searchParams }: Props) {
  await requireRole(["admin"], "/admin/mentors");
  const params = await searchParams;
  const status = (MENTOR_APPLICATION_STATUSES as readonly string[]).includes(String(params.status))
    ? (params.status as MentorApplicationStatus)
    : "submitted";
  const done = typeof params.done === "string" ? doneMessages[params.done] : undefined;

  const rows = await getDb()
    .select({
      id: mentorApplications.id,
      name: users.name,
      email: users.email,
      exam: exams.shortName,
      badge: mentorApplications.claimedBadge,
      examYear: mentorApplications.examYear,
      submittedAt: mentorApplications.submittedAt,
      updatedAt: mentorApplications.updatedAt,
      reviewedAt: mentorApplications.reviewedAt,
    })
    .from(mentorApplications)
    .innerJoin(users, eq(users.id, mentorApplications.userId))
    .leftJoin(exams, eq(exams.id, mentorApplications.examId))
    .where(eq(mentorApplications.status, status))
    .orderBy(
      status === "submitted"
        ? asc(mentorApplications.submittedAt)
        : desc(mentorApplications.updatedAt),
    )
    .limit(100);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-extrabold">Mentor applications</h1>
      {done ? (
        <div className="mt-6">
          <FormMessage tone="success">{done}</FormMessage>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2" role="list">
        {tabs.map((tab) => (
          <Link
            key={tab}
            role="listitem"
            href={`/admin/mentors?status=${tab}`}
            aria-current={tab === status ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold",
              tab === status
                ? "border-pen bg-pen text-white"
                : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {MENTOR_APPLICATION_STATUS_LABELS[tab]}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-ink-muted mt-8">
          No applications here.{" "}
          {status === "submitted"
            ? "New submissions will appear in this list, oldest first."
            : null}
        </p>
      ) : (
        <div className="border-line bg-surface mt-6 overflow-x-auto rounded-[var(--radius-control)] border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-line text-ink-muted border-b">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Applicant
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Exam
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  Claimed result
                </th>
                <th scope="col" className="px-4 py-3 font-semibold">
                  {status === "submitted" ? "Waiting" : "Last updated"}
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">
                    <span className="block font-semibold">{row.name}</span>
                    <span className="text-ink-muted">{row.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    {row.exam ?? "—"} {row.examYear ?? ""}
                  </td>
                  <td className="px-4 py-3">
                    {row.badge ? MENTOR_BADGE_INFO[row.badge].label : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {status === "submitted" && row.submittedAt
                      ? waitingFor(row.submittedAt)
                      : dateFormat.format(row.reviewedAt ?? row.updatedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/mentors/${row.id}`} className="text-pen font-semibold">
                      {status === "submitted" ? "Review" : "View"}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
