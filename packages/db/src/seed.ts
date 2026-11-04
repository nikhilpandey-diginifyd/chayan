import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { EXAMS } from "@chayan/shared";
import { createDb } from "./client";
import { examStages, exams } from "./schema";

config({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is missing");

const db = createDb(url, { max: 1 });

// Idempotent: safe to run on every deploy. Updates names, never deletes rows.
await db.transaction(async (tx) => {
  for (const [examIndex, exam] of EXAMS.entries()) {
    const [row] = await tx
      .insert(exams)
      .values({
        code: exam.code,
        body: exam.body,
        name: exam.name,
        shortName: exam.shortName,
        nameHi: exam.nameHi,
        sortOrder: examIndex,
      })
      .onConflictDoUpdate({
        target: exams.code,
        set: {
          body: sql`excluded.body`,
          name: sql`excluded.name`,
          shortName: sql`excluded.short_name`,
          nameHi: sql`excluded.name_hi`,
          sortOrder: sql`excluded.sort_order`,
        },
      })
      .returning({ id: exams.id });

    if (!row) throw new Error(`Failed to upsert exam ${exam.code}`);

    for (const [stageIndex, stage] of exam.stages.entries()) {
      await tx
        .insert(examStages)
        .values({
          examId: row.id,
          code: stage.code,
          name: stage.name,
          nameHi: stage.nameHi,
          sortOrder: stageIndex,
        })
        .onConflictDoUpdate({
          target: [examStages.examId, examStages.code],
          set: {
            name: sql`excluded.name`,
            nameHi: sql`excluded.name_hi`,
            sortOrder: sql`excluded.sort_order`,
          },
        });
    }
  }
});

console.log(`Seeded ${EXAMS.length} exams`);
await db.$client.end();
