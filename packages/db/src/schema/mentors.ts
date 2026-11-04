import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import {
  MENTOR_APPLICATION_STATUSES,
  MENTOR_BADGES,
  MENTOR_DOCUMENT_KINDS,
  type PrepLanguage,
} from "@chayan/shared";
import { timestamps } from "./_shared";
import { users } from "./auth";
import { exams } from "./exams";

export const mentorBadgeEnum = pgEnum("mentor_badge", MENTOR_BADGES);
export const mentorApplicationStatusEnum = pgEnum(
  "mentor_application_status",
  MENTOR_APPLICATION_STATUSES,
);
export const mentorDocumentKindEnum = pgEnum("mentor_document_kind", MENTOR_DOCUMENT_KINDS);
export const mentorStatusEnum = pgEnum("mentor_status", ["active", "suspended"]);

/** One application per user. Resubmissions update the same row. */
export const mentorApplications = pgTable(
  "mentor_applications",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    status: mentorApplicationStatusEnum().notNull().default("draft"),

    phone: text(),
    city: text(),
    state: text(),
    examId: uuid().references(() => exams.id, { onDelete: "restrict" }),
    claimedBadge: mentorBadgeEnum(),
    examYear: integer(),
    rank: text(),
    rollNumber: text(),
    languages: text().array().$type<PrepLanguage[]>().notNull().default([]),
    bio: text(),
    introVideoUrl: text(),
    inGovernmentService: boolean(),

    submittedAt: timestamp({ withTimezone: true }),
    reviewedAt: timestamp({ withTimezone: true }),
    reviewedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    reviewNote: text(),
    ...timestamps,
  },
  (t) => [index("mentor_applications_status_idx").on(t.status, t.submittedAt)],
);

export const mentorDocuments = pgTable(
  "mentor_documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    applicationId: uuid()
      .notNull()
      .references(() => mentorApplications.id, { onDelete: "cascade" }),
    kind: mentorDocumentKindEnum().notNull(),
    storageKey: text().notNull().unique(),
    fileName: text().notNull(),
    contentType: text().notNull(),
    sizeBytes: bigint({ mode: "number" }).notNull(),
    sha256: text().notNull(),
    uploadedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("mentor_documents_application_idx").on(t.applicationId)],
);

/** Created when an application is approved. Booking settings join this in Phase 4. */
export const mentorProfiles = pgTable(
  "mentor_profiles",
  {
    userId: uuid()
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    examId: uuid()
      .notNull()
      .references(() => exams.id, { onDelete: "restrict" }),
    badge: mentorBadgeEnum().notNull(),
    examYear: integer().notNull(),
    rank: text(),
    languages: text().array().$type<PrepLanguage[]>().notNull(),
    bio: text().notNull(),
    status: mentorStatusEnum().notNull().default("active"),
    approvedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    approvedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("mentor_profiles_exam_idx").on(t.examId, t.status)],
);

/** Append-only record of sensitive admin actions. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid().primaryKey().defaultRandom(),
    actorUserId: uuid().references(() => users.id, { onDelete: "set null" }),
    action: text().notNull(),
    entityType: text().notNull(),
    entityId: text().notNull(),
    details: jsonb().$type<Record<string, unknown>>(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_entity_idx").on(t.entityType, t.entityId)],
);

export const mentorApplicationsRelations = relations(mentorApplications, ({ one, many }) => ({
  user: one(users, { fields: [mentorApplications.userId], references: [users.id] }),
  exam: one(exams, { fields: [mentorApplications.examId], references: [exams.id] }),
  documents: many(mentorDocuments),
}));

export const mentorDocumentsRelations = relations(mentorDocuments, ({ one }) => ({
  application: one(mentorApplications, {
    fields: [mentorDocuments.applicationId],
    references: [mentorApplications.id],
  }),
}));

export const mentorProfilesRelations = relations(mentorProfiles, ({ one }) => ({
  user: one(users, { fields: [mentorProfiles.userId], references: [users.id] }),
  exam: one(exams, { fields: [mentorProfiles.examId], references: [exams.id] }),
}));
