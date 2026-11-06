import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  MENTOR_APPLICATION_STATUSES,
  MENTOR_BADGES,
  MENTOR_DOCUMENT_KINDS,
  type FocusArea,
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

    // Public profile (Phase 4)
    slug: text().unique(),
    headline: text(),
    photoKey: text(),
    focusAreas: text().array().$type<FocusArea[]>().notNull().default([]),
    stageCodes: text().array().notNull().default([]),
    isPublished: boolean().notNull().default(false),

    // Booking settings
    bufferMinutes: integer().notNull().default(10),
    minNoticeHours: integer().notNull().default(6),
    bookingWindowDays: integer().notNull().default(14),
    noShowCount: integer().notNull().default(0),
    approvedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    approvedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("mentor_profiles_exam_idx").on(t.examId, t.status, t.isPublished)],
);

/** Session types a mentor offers. One row per duration. */
export const mentorServices = pgTable(
  "mentor_services",
  {
    id: uuid().primaryKey().defaultRandom(),
    mentorUserId: uuid()
      .notNull()
      .references(() => mentorProfiles.userId, { onDelete: "cascade" }),
    durationMinutes: integer().notNull(),
    pricePaise: integer().notNull(),
    isActive: boolean().notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("mentor_services_mentor_duration_uq").on(t.mentorUserId, t.durationMinutes),
    check("mentor_services_duration_ck", sql`${t.durationMinutes} in (15, 30, 60)`),
    check("mentor_services_price_ck", sql`${t.pricePaise} between 9900 and 999900`),
  ],
);

/** Weekly availability in IST, minutes from midnight. */
export const mentorAvailabilityRules = pgTable(
  "mentor_availability_rules",
  {
    id: uuid().primaryKey().defaultRandom(),
    mentorUserId: uuid()
      .notNull()
      .references(() => mentorProfiles.userId, { onDelete: "cascade" }),
    weekday: smallint().notNull(),
    startMinute: integer().notNull(),
    endMinute: integer().notNull(),
  },
  (t) => [
    index("mentor_availability_mentor_idx").on(t.mentorUserId),
    check("mentor_availability_weekday_ck", sql`${t.weekday} between 0 and 6`),
    check(
      "mentor_availability_range_ck",
      sql`${t.startMinute} >= 0 and ${t.endMinute} <= 1440 and ${t.startMinute} < ${t.endMinute}`,
    ),
  ],
);

/** IST dates a mentor is unavailable. */
export const mentorBlockedDates = pgTable(
  "mentor_blocked_dates",
  {
    mentorUserId: uuid()
      .notNull()
      .references(() => mentorProfiles.userId, { onDelete: "cascade" }),
    date: date({ mode: "string" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.mentorUserId, t.date] })],
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

export const mentorProfilesRelations = relations(mentorProfiles, ({ one, many }) => ({
  user: one(users, { fields: [mentorProfiles.userId], references: [users.id] }),
  exam: one(exams, { fields: [mentorProfiles.examId], references: [exams.id] }),
  services: many(mentorServices),
  availabilityRules: many(mentorAvailabilityRules),
  blockedDates: many(mentorBlockedDates),
}));

export const mentorServicesRelations = relations(mentorServices, ({ one }) => ({
  mentor: one(mentorProfiles, {
    fields: [mentorServices.mentorUserId],
    references: [mentorProfiles.userId],
  }),
}));

export const mentorAvailabilityRulesRelations = relations(mentorAvailabilityRules, ({ one }) => ({
  mentor: one(mentorProfiles, {
    fields: [mentorAvailabilityRules.mentorUserId],
    references: [mentorProfiles.userId],
  }),
}));

export const mentorBlockedDatesRelations = relations(mentorBlockedDates, ({ one }) => ({
  mentor: one(mentorProfiles, {
    fields: [mentorBlockedDates.mentorUserId],
    references: [mentorProfiles.userId],
  }),
}));
