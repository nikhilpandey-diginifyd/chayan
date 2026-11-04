import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { asc, eq, exams } from "@chayan/db";
import {
  MENTOR_BADGE_INFO,
  MENTOR_DOCUMENT_INFO,
  PREP_LANGUAGE_LABELS,
  type PrepLanguage,
} from "@chayan/shared";
import {
  ApplicationDetailsForm,
  emptyDetails,
  type DetailsValues,
} from "@/components/mentor/application-details-form";
import { DocumentUploader } from "@/components/mentor/document-uploader";
import { SubmitApplication } from "@/components/mentor/submit-application";
import { FormMessage } from "@/components/ui/field";
import { getDb } from "@/lib/db";
import {
  getApplicationForUser,
  getMentorProfile,
  isEditable,
  missingRequiredDocuments,
} from "@/lib/mentor-applications";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Apply to mentor", robots: { index: false } };

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeZone: "Asia/Kolkata",
});

function Section({
  title,
  description,
  children,
  muted,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      className={
        muted
          ? "border-line rounded-[var(--radius-panel)] border border-dashed p-6 sm:p-8"
          : "border-line bg-surface rounded-[var(--radius-panel)] border p-6 sm:p-8"
      }
    >
      <h2 className="text-xl font-bold">{title}</h2>
      {description ? <p className="text-ink-muted mt-2 max-w-prose">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function MentorApplyPage() {
  const user = await requireUser("/mentor/apply");
  if (await getMentorProfile(user.id)) redirect("/mentor");

  const application = await getApplicationForUser(user.id);
  const examOptions = await getDb().query.exams.findMany({
    where: eq(exams.isActive, true),
    orderBy: asc(exams.sortOrder),
    columns: { id: true, shortName: true, body: true },
  });

  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: thisYear - 2000 + 1 }, (_, index) => thisYear - index);

  const status = application?.status ?? "draft";
  const editable = isEditable(status);
  const documents = application?.documents ?? [];
  const missingDocs = missingRequiredDocuments(documents.map((document) => document.kind));
  const detailsSaved = Boolean(application?.examId && application.bio);

  const blockers = [
    ...(detailsSaved ? [] : ["Save your details"]),
    ...missingDocs.map((kind) => `Upload your ${MENTOR_DOCUMENT_INFO[kind].label}`),
  ];

  const initial: DetailsValues = application
    ? {
        phone: application.phone ?? "",
        city: application.city ?? "",
        state: application.state ?? "",
        examId: application.examId ?? "",
        claimedBadge: application.claimedBadge ?? "",
        examYear: application.examYear ? String(application.examYear) : "",
        rank: application.rank ?? "",
        rollNumber: application.rollNumber ?? "",
        languages: application.languages,
        bio: application.bio ?? "",
        introVideoUrl: application.introVideoUrl ?? "",
        inGovernmentService:
          application.inGovernmentService === null
            ? ""
            : application.inGovernmentService
              ? "yes"
              : "no",
      }
    : emptyDetails;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Apply to mentor</h1>
      <p className="text-ink-muted mt-3 max-w-prose">
        We verify every mentor&apos;s result against official documents before their profile goes
        live. It takes about 10 minutes to apply.
      </p>

      <div className="mt-8 space-y-4">
        {status === "submitted" && application?.submittedAt ? (
          <FormMessage tone="info">
            <strong>Under review</strong> since {dateFormat.format(application.submittedAt)}. We
            usually finish within 3 working days and will email you at {user.email}.
          </FormMessage>
        ) : null}
        {status === "changes_requested" ? (
          <FormMessage tone="error">
            <strong>We need a change before we can approve you:</strong> {application?.reviewNote}
          </FormMessage>
        ) : null}
        {status === "rejected" ? (
          <FormMessage tone="error">
            <strong>Your last application wasn&apos;t approved:</strong> {application?.reviewNote}{" "}
            You can update it and apply again.
          </FormMessage>
        ) : null}
      </div>

      <div className="mt-8 space-y-8">
        {editable ? (
          <>
            <Section title="Your details">
              <ApplicationDetailsForm exams={examOptions} years={years} initial={initial} />
            </Section>

            {application ? (
              <Section
                title="Documents"
                description="Upload proof of the result you chose above and a photo ID."
              >
                <DocumentUploader documents={documents} editable />
              </Section>
            ) : (
              <Section title="Documents" muted>
                <p className="text-ink-muted">
                  Save your details first, then upload documents here.
                </p>
              </Section>
            )}

            <Section title="Submit for review">
              <SubmitApplication ready={blockers.length === 0} blockers={blockers} />
            </Section>
          </>
        ) : application ? (
          <>
            <Section title="Your details">
              <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <SummaryItem label="Exam" value={application.exam?.shortName} />
                <SummaryItem
                  label="Result"
                  value={
                    application.claimedBadge
                      ? MENTOR_BADGE_INFO[application.claimedBadge].label
                      : undefined
                  }
                />
                <SummaryItem label="Exam year" value={application.examYear?.toString()} />
                <SummaryItem label="Roll number" value={application.rollNumber} />
                <SummaryItem label="Rank" value={application.rank} />
                <SummaryItem
                  label="Languages"
                  value={application.languages
                    .map((language: PrepLanguage) => PREP_LANGUAGE_LABELS[language])
                    .join(", ")}
                />
                <SummaryItem
                  label="Location"
                  value={[application.city, application.state].filter(Boolean).join(", ")}
                />
                <SummaryItem label="Mobile" value={application.phone} />
              </dl>
              <p className="text-ink-muted mt-6 whitespace-pre-line">{application.bio}</p>
            </Section>
            <Section title="Documents">
              <DocumentUploader documents={documents} editable={false} />
            </Section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-ink-muted text-sm">{label}</dt>
      <dd className="font-semibold">{value || "—"}</dd>
    </div>
  );
}
