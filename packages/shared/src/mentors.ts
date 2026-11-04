import { z } from "zod";
import type { ExamBody } from "./exams";

/**
 * Verified result badges. A mentor can only hold a badge we have checked
 * against official documents.
 */
export const MENTOR_BADGES = [
  "selected",
  "interview_appeared",
  "mains_qualified",
  "tier2_qualified",
  "subject_expert",
] as const;
export const mentorBadgeSchema = z.enum(MENTOR_BADGES);
export type MentorBadge = z.infer<typeof mentorBadgeSchema>;

export const MENTOR_BADGE_INFO: Record<
  MentorBadge,
  { label: string; description: string; bodies: readonly ExamBody[]; proof: string }
> = {
  selected: {
    label: "Selected",
    description: "Recommended in the final result",
    bodies: ["UPSC", "SSC"],
    proof: "Final result PDF or appointment letter showing your name and roll number",
  },
  interview_appeared: {
    label: "Interview appeared",
    description: "Cleared Mains and appeared for the UPSC personality test",
    bodies: ["UPSC"],
    proof: "Interview call letter (e-summon) or Mains result with your roll number",
  },
  mains_qualified: {
    label: "Mains qualified",
    description: "Cleared Prelims and wrote UPSC Mains",
    bodies: ["UPSC"],
    proof: "Prelims result with your roll number, or your Mains admit card",
  },
  tier2_qualified: {
    label: "Tier 2 qualified",
    description: "Shortlisted for SSC Tier 2 or the next stage",
    bodies: ["SSC"],
    proof: "Tier 1 result or scorecard showing your roll number",
  },
  subject_expert: {
    label: "Subject expert",
    description: "Teaches a subject professionally without a result badge",
    bodies: ["UPSC", "SSC"],
    proof: "Proof of teaching experience, such as an employment or institute letter",
  },
};

export function badgesForExamBody(body: ExamBody): MentorBadge[] {
  return MENTOR_BADGES.filter((badge) => MENTOR_BADGE_INFO[badge].bodies.includes(body));
}

export const MENTOR_APPLICATION_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "rejected",
] as const;
export type MentorApplicationStatus = (typeof MENTOR_APPLICATION_STATUSES)[number];

export const MENTOR_APPLICATION_STATUS_LABELS: Record<MentorApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Under review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Not approved",
};

export const MENTOR_DOCUMENT_KINDS = [
  "result_proof",
  "marksheet",
  "id_proof",
  "pan_card",
  "other",
] as const;
export const mentorDocumentKindSchema = z.enum(MENTOR_DOCUMENT_KINDS);
export type MentorDocumentKind = z.infer<typeof mentorDocumentKindSchema>;

export const MENTOR_DOCUMENT_INFO: Record<
  MentorDocumentKind,
  { label: string; hint: string; required: boolean }
> = {
  result_proof: {
    label: "Result proof",
    hint: "The official document for the badge you claim. It must show your name and roll number.",
    required: true,
  },
  id_proof: {
    label: "Government photo ID",
    hint: "Aadhaar (mask the first 8 digits), voter ID, passport or driving licence.",
    required: true,
  },
  marksheet: {
    label: "Marksheet",
    hint: "Optional, but it speeds up verification.",
    required: false,
  },
  pan_card: {
    label: "PAN card",
    hint: "Optional now. Needed before your first payout for tax deduction.",
    required: false,
  },
  other: {
    label: "Other supporting document",
    hint: "Anything else that helps us verify your claim.",
    required: false,
  },
};

export const MENTOR_DOCUMENT_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  maxPerApplication: 10,
  contentTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const,
};

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;
export type IndianState = (typeof INDIAN_STATES)[number];

/** What a mentor can help with. Shown as filters and on profiles. */
export const FOCUS_AREAS = [
  "strategy",
  "answer_writing",
  "optional_subject",
  "interview_daf",
  "current_affairs",
  "quant",
  "reasoning",
  "english",
  "general_awareness",
  "hindi_medium",
  "working_professionals",
  "repeaters",
] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

export const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  strategy: "Overall strategy",
  answer_writing: "Answer writing",
  optional_subject: "Optional subject",
  interview_daf: "Interview and DAF",
  current_affairs: "Current affairs",
  quant: "Quantitative aptitude",
  reasoning: "Reasoning",
  english: "English",
  general_awareness: "General awareness",
  hindi_medium: "Hindi medium",
  working_professionals: "Preparing while working",
  repeaters: "Repeat attempts",
};
