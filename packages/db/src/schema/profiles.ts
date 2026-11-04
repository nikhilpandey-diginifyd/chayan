import { relations } from "drizzle-orm";
import { index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { PREP_LANGUAGES } from "@chayan/shared";
import { timestamps } from "./_shared";
import { users } from "./auth";
import { examStages, exams } from "./exams";

export const prepLanguageEnum = pgEnum("prep_language", PREP_LANGUAGES);

/** One row per aspirant, created during onboarding. */
export const aspirantProfiles = pgTable(
  "aspirant_profiles",
  {
    userId: uuid()
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    examId: uuid()
      .notNull()
      .references(() => exams.id, { onDelete: "restrict" }),
    examStageId: uuid()
      .notNull()
      .references(() => examStages.id, { onDelete: "restrict" }),
    targetYear: integer().notNull(),
    language: prepLanguageEnum().notNull(),
    attemptNumber: integer().notNull(),
    ...timestamps,
  },
  (t) => [index("aspirant_profiles_exam_id_idx").on(t.examId)],
);

/**
 * Record of every consent a user gives (DPDP Act). Append-only: a new row
 * for each acceptance, never updated.
 */
export const consents = pgTable(
  "consents",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text().notNull(),
    documentVersion: text().notNull(),
    ipAddress: text(),
    userAgent: text(),
    acceptedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("consents_user_id_idx").on(t.userId)],
);

export const aspirantProfilesRelations = relations(aspirantProfiles, ({ one }) => ({
  user: one(users, { fields: [aspirantProfiles.userId], references: [users.id] }),
  exam: one(exams, { fields: [aspirantProfiles.examId], references: [exams.id] }),
  stage: one(examStages, {
    fields: [aspirantProfiles.examStageId],
    references: [examStages.id],
  }),
}));
