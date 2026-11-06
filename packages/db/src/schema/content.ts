import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { PAPER_LANGUAGES } from "@chayan/shared";
import { timestamps } from "./_shared";
import { users } from "./auth";
import { exams } from "./exams";

export const paperLanguageEnum = pgEnum("paper_language", PAPER_LANGUAGES);

/** Previous year question papers. Public pages for search; downloads need a free account. */
export const pyqPapers = pgTable(
  "pyq_papers",
  {
    id: uuid().primaryKey().defaultRandom(),
    examId: uuid()
      .notNull()
      .references(() => exams.id, { onDelete: "restrict" }),
    year: integer().notNull(),
    title: text().notNull(),
    slug: text().notNull().unique(),
    language: paperLanguageEnum().notNull(),
    description: text(),
    sourceUrl: text(),
    storageKey: text().notNull().unique(),
    fileSizeBytes: integer().notNull(),
    answerKeyStorageKey: text(),
    isPublished: boolean().notNull().default(true),
    downloadCount: integer().notNull().default(0),
    uploadedBy: uuid().references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [index("pyq_papers_exam_year_idx").on(t.examId, t.year, t.isPublished)],
);

export const paperDownloads = pgTable(
  "paper_downloads",
  {
    id: uuid().primaryKey().defaultRandom(),
    paperId: uuid()
      .notNull()
      .references(() => pyqPapers.id, { onDelete: "cascade" }),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text().notNull().default("paper"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("paper_downloads_user_idx").on(t.userId, t.createdAt)],
);

/** Short prep videos hosted on YouTube and embedded on the site. */
export const prepVideos = pgTable(
  "prep_videos",
  {
    id: uuid().primaryKey().defaultRandom(),
    examId: uuid().references(() => exams.id, { onDelete: "set null" }),
    title: text().notNull(),
    slug: text().notNull().unique(),
    youtubeId: text().notNull(),
    description: text(),
    topic: text(),
    isPublished: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [index("prep_videos_exam_idx").on(t.examId, t.isPublished, t.sortOrder)],
);

export const pyqPapersRelations = relations(pyqPapers, ({ one }) => ({
  exam: one(exams, { fields: [pyqPapers.examId], references: [exams.id] }),
}));

export const prepVideosRelations = relations(prepVideos, ({ one }) => ({
  exam: one(exams, { fields: [prepVideos.examId], references: [exams.id] }),
}));
