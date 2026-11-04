import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";
import { asc, eq, mentorApplications, mentorDocuments, mentorProfiles } from "@chayan/db";
import {
  badgesForExamBody,
  MENTOR_APPLICATION_STATUS_LABELS,
  MENTOR_BADGE_INFO,
  MENTOR_DOCUMENT_INFO,
  PREP_LANGUAGE_LABELS,
} from "@chayan/shared";
import { ReviewForm } from "@/components/admin/review-form";
import { Button } from "@/components/ui/button";
import { setMentorStatus } from "./actions";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Review application", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = { params: Promise<{ id: string }> };

export default async function ReviewApplicationPage({ params }: Props) {
  const admin = await requireRole(["admin"], "/admin/mentors");
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const application = await getDb().query.mentorApplications.findFirst({
    where: eq(mentorApplications.id, id),
    with: {
      user: { columns: { name: true, email: true, emailVerified: true, createdAt: true } },
      exam: { columns: { shortName: true, body: true } },
      documents: { orderBy: asc(mentorDocuments.uploadedAt) },
    },
  });
  if (!application) notFound();

  const mentorProfile =
    application.status === "approved"
      ? await getDb().query.mentorProfiles.findFirst({
          where: eq(mentorProfiles.userId, application.userId),
          columns: { status: true, slug: true, isPublished: true },
        })
      : undefined;

  const claimed = application.claimedBadge ? MENTOR_BADGE_INFO[application.claimedBadge] : null;
  const badgeOptions = application.exam ? badgesForExamBody(application.exam.body) : [];
  const canReview = application.status === "submitted" && application.userId !== admin.id;

  const details: [string, string | null | undefined][] = [
    ["Email", `${application.user.email}${application.user.emailVerified ? " (confirmed)" : ""}`],
    ["Mobile", application.phone],
    ["Location", [application.city, application.state].filter(Boolean).join(", ")],
    [
      "Exam",
      application.exam ? `${application.exam.shortName} ${application.examYear ?? ""}` : null,
    ],
    ["Claimed result", claimed?.label],
    ["Roll number", application.rollNumber],
    ["Rank", application.rank],
    ["Languages", application.languages.map((l) => PREP_LANGUAGE_LABELS[l]).join(", ")],
    [
      "In government service",
      application.inGovernmentService === null
        ? null
        : application.inGovernmentService
          ? "Yes (confirmed they have the required permission)"
          : "No",
    ],
    ["Joined", dateFormat.format(application.user.createdAt)],
    ["Submitted", application.submittedAt ? dateFormat.format(application.submittedAt) : null],
  ];

  return (
    <div className="py-10">
      <Link href="/admin/mentors" className="text-pen text-sm font-semibold">
        All applications
      </Link>
      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <h1 className="text-3xl font-extrabold">{application.user.name}</h1>
        <span className="border-line bg-surface rounded-full border px-3 py-1 text-sm font-semibold">
          {MENTOR_APPLICATION_STATUS_LABELS[application.status]}
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6">
            <h2 className="text-xl font-bold">Details</h2>
            <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-ink-muted text-sm">{label}</dt>
                  <dd className="font-semibold break-words">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            {application.introVideoUrl ? (
              <p className="mt-4">
                <a
                  href={application.introVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-pen font-semibold"
                >
                  Open intro video
                </a>
              </p>
            ) : null}
            <h3 className="mt-6 font-semibold">About</h3>
            <p className="text-ink-muted mt-2 whitespace-pre-line">{application.bio ?? "—"}</p>
          </section>

          <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6">
            <h2 className="text-xl font-bold">Documents</h2>
            {claimed ? (
              <p className="text-ink-muted mt-2 text-sm">Expected proof: {claimed.proof}</p>
            ) : null}
            {application.documents.length === 0 ? (
              <p className="text-ink-muted mt-4">No documents uploaded.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {application.documents.map((document) => (
                  <li key={document.id}>
                    <a
                      href={`/api/documents/${document.id}`}
                      target="_blank"
                      rel="noopener"
                      className="border-line hover:border-ink-muted flex items-center gap-3 rounded-[var(--radius-control)] border px-3 py-2"
                    >
                      <FileText aria-hidden="true" className="text-pen size-5 shrink-0" />
                      <span className="min-w-0">
                        <span className="block font-semibold">
                          {MENTOR_DOCUMENT_INFO[document.kind].label}
                        </span>
                        <span className="text-ink-muted block truncate text-sm">
                          {document.fileName}, {formatSize(document.sizeBytes)}
                        </span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside>
          <section className="border-line bg-surface rounded-[var(--radius-panel)] border p-6 lg:sticky lg:top-6">
            <h2 className="text-xl font-bold">Decision</h2>
            {canReview && application.claimedBadge ? (
              <>
                <ul className="text-ink-muted mt-4 list-disc space-y-1 pl-5 text-sm">
                  <li>Name on the result matches the ID and the account name.</li>
                  <li>Roll number appears in the official result for {application.examYear}.</li>
                  <li>The result proves the claimed badge, not just an earlier stage.</li>
                  <li>The ID photo matches the intro video, if there is one.</li>
                </ul>
                <div className="mt-6">
                  <ReviewForm
                    applicationId={application.id}
                    claimedBadge={application.claimedBadge}
                    badgeOptions={badgeOptions}
                  />
                </div>
              </>
            ) : (
              <div className="text-ink-muted mt-4 space-y-2">
                {application.status === "submitted" && application.userId === admin.id ? (
                  <p>You can&apos;t review your own application. Another admin has to.</p>
                ) : application.status === "submitted" ? (
                  <p>The application is incomplete.</p>
                ) : (
                  <p>
                    {MENTOR_APPLICATION_STATUS_LABELS[application.status]}
                    {application.reviewedAt
                      ? ` on ${dateFormat.format(application.reviewedAt)}`
                      : ""}
                    .
                  </p>
                )}
                {application.reviewNote ? (
                  <p>
                    Note: <span className="text-ink">{application.reviewNote}</span>
                  </p>
                ) : null}
                {mentorProfile ? (
                  <div className="border-line mt-4 space-y-3 border-t pt-4">
                    <p>
                      Mentor profile:{" "}
                      <span className="text-ink font-semibold">
                        {mentorProfile.status === "suspended"
                          ? "paused"
                          : mentorProfile.isPublished
                            ? "live"
                            : "not published yet"}
                      </span>
                      {mentorProfile.slug ? (
                        <>
                          {" "}
                          <Link
                            href={`/mentors/${mentorProfile.slug}`}
                            className="text-pen font-semibold"
                          >
                            View
                          </Link>
                        </>
                      ) : null}
                    </p>
                    <form action={setMentorStatus}>
                      <input type="hidden" name="applicationId" value={application.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={mentorProfile.status === "suspended" ? "active" : "suspended"}
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        {mentorProfile.status === "suspended" ? "Restore mentor" : "Pause mentor"}
                      </Button>
                    </form>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
