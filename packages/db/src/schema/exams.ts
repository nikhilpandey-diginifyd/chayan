import { relations } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { EXAM_BODIES } from "@chayan/shared";
import { timestamps } from "./_shared";

export const examBodyEnum = pgEnum("exam_body", EXAM_BODIES);

export const exams = pgTable("exams", {
  id: uuid().primaryKey().defaultRandom(),
  code: text().notNull().unique(),
  body: examBodyEnum().notNull(),
  name: text().notNull(),
  shortName: text().notNull(),
  nameHi: text().notNull(),
  isActive: boolean().notNull().default(true),
  sortOrder: integer().notNull().default(0),
  ...timestamps,
});

export const examStages = pgTable(
  "exam_stages",
  {
    id: uuid().primaryKey().defaultRandom(),
    examId: uuid()
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    code: text().notNull(),
    name: text().notNull(),
    nameHi: text().notNull(),
    sortOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [uniqueIndex("exam_stages_exam_code_uq").on(t.examId, t.code)],
);

export const examsRelations = relations(exams, ({ many }) => ({
  stages: many(examStages),
}));

export const examStagesRelations = relations(examStages, ({ one }) => ({
  exam: one(exams, { fields: [examStages.examId], references: [exams.id] }),
}));
