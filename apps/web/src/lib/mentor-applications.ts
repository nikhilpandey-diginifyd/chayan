import "server-only";
import { z } from "zod";
import { cache } from "react";
import { asc, eq, mentorApplications, mentorDocuments, mentorProfiles } from "@chayan/db";
import {
  INDIAN_STATES,
  MENTOR_BADGES,
  MENTOR_DOCUMENT_INFO,
  MENTOR_DOCUMENT_KINDS,
  PREP_LANGUAGES,
  type MentorApplicationStatus,
  type MentorDocumentKind,
} from "@chayan/shared";
import { getDb } from "@/lib/db";

export const EDITABLE_STATUSES: readonly MentorApplicationStatus[] = [
  "draft",
  "changes_requested",
  "rejected",
];

export function isEditable(status: MentorApplicationStatus) {
  return EDITABLE_STATUSES.includes(status);
}

export const REQUIRED_DOCUMENT_KINDS = MENTOR_DOCUMENT_KINDS.filter(
  (kind) => MENTOR_DOCUMENT_INFO[kind].required,
);

export function missingRequiredDocuments(kinds: MentorDocumentKind[]): MentorDocumentKind[] {
  return REQUIRED_DOCUMENT_KINDS.filter((kind) => !kinds.includes(kind));
}

const currentYear = () => new Date().getFullYear();

export const applicationDetailsSchema = z.object({
  phone: z
    .string()
    .transform((value) => value.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
    .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number")),
  city: z.string().trim().min(2, "Enter your city").max(60, "Use 60 characters or fewer"),
  state: z.enum(INDIAN_STATES, "Choose your state"),
  examId: z.uuid("Choose the exam you cleared"),
  claimedBadge: z.enum(MENTOR_BADGES, "Choose the result you can prove"),
  examYear: z.coerce
    .number<string>()
    .int("Choose the year")
    .min(2000, "Choose the year")
    .refine((year) => year <= currentYear(), "Choose the year"),
  rank: z
    .string()
    .trim()
    .max(30, "Use 30 characters or fewer")
    .transform((value) => value || null),
  rollNumber: z
    .string()
    .trim()
    .min(4, "Enter your roll number")
    .max(30, "Use 30 characters or fewer")
    .regex(/^[A-Za-z0-9/-]+$/, "Use only letters, numbers, / and -"),
  languages: z.array(z.enum(PREP_LANGUAGES)).min(1, "Choose at least one language"),
  bio: z
    .string()
    .trim()
    .min(80, "Write at least 80 characters so aspirants know how you can help")
    .max(800, "Use 800 characters or fewer"),
  introVideoUrl: z
    .string()
    .trim()
    .max(300, "Use a shorter link")
    .transform((value) => value || null)
    .pipe(z.url({ protocol: /^https$/, error: "Use a full https:// link" }).nullable()),
  inGovernmentService: z.enum(["yes", "no"], "Tell us if you are in government service"),
  servicePermission: z.string().optional(),
});

export type ApplicationDetails = z.output<typeof applicationDetailsSchema>;
export type ApplicationFieldErrors = Partial<
  Record<keyof z.input<typeof applicationDetailsSchema>, string>
>;

export const getApplicationForUser = cache(async (userId: string) => {
  return getDb().query.mentorApplications.findFirst({
    where: eq(mentorApplications.userId, userId),
    with: {
      exam: { columns: { id: true, shortName: true, body: true } },
      documents: { orderBy: asc(mentorDocuments.uploadedAt) },
    },
  });
});

export const getMentorProfile = cache(async (userId: string) => {
  return getDb().query.mentorProfiles.findFirst({
    where: eq(mentorProfiles.userId, userId),
    with: { exam: { columns: { shortName: true } } },
  });
});
