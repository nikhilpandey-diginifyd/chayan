import "server-only";
import { randomBytes } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  exams,
  ne,
  prepVideos,
  pyqPapers,
  sql,
  type Database,
} from "@chayan/db";
import { EXAM_CODES, PAPER_LANGUAGES, type ExamCode, type PaperLanguage } from "@chayan/shared";
import { getDb } from "@/lib/db";
import { slugify } from "@/lib/mentor-profile";

export async function uniqueSlug(
  base: string,
  table: typeof pyqPapers | typeof prepVideos,
  db: Pick<Database, "select"> = getDb(),
): Promise<string> {
  const root = slugify(base, 80) || "item";
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = attempt === 0 ? root : `${root}-${randomBytes(2).toString("hex")}`;
    const [taken] = await db
      .select({ id: table.id })
      .from(table)
      .where(eq(table.slug, candidate))
      .limit(1);
    if (!taken) return candidate;
  }
  throw new Error("Could not create a unique link");
}

export type PaperFilters = { exam?: ExamCode; year?: number; language?: PaperLanguage };

export function parsePaperFilters(
  params: Record<string, string | string[] | undefined>,
): PaperFilters {
  const exam =
    typeof params.exam === "string" && (EXAM_CODES as readonly string[]).includes(params.exam)
      ? (params.exam as ExamCode)
      : undefined;
  const year = Number(params.year);
  const language =
    typeof params.language === "string" &&
    (PAPER_LANGUAGES as readonly string[]).includes(params.language)
      ? (params.language as PaperLanguage)
      : undefined;
  return { exam, year: Number.isInteger(year) && year > 1990 ? year : undefined, language };
}

const paperColumns = {
  id: pyqPapers.id,
  slug: pyqPapers.slug,
  title: pyqPapers.title,
  year: pyqPapers.year,
  language: pyqPapers.language,
  fileSizeBytes: pyqPapers.fileSizeBytes,
  downloadCount: pyqPapers.downloadCount,
  hasAnswerKey: sql<boolean>`${pyqPapers.answerKeyStorageKey} is not null`,
  examCode: exams.code,
  examShortName: exams.shortName,
};

export async function listPapers(filters: PaperFilters, limit = 200) {
  const conditions = [eq(pyqPapers.isPublished, true)];
  if (filters.exam) conditions.push(eq(exams.code, filters.exam));
  if (filters.year) conditions.push(eq(pyqPapers.year, filters.year));
  if (filters.language) conditions.push(eq(pyqPapers.language, filters.language));
  return getDb()
    .select(paperColumns)
    .from(pyqPapers)
    .innerJoin(exams, eq(exams.id, pyqPapers.examId))
    .where(and(...conditions))
    .orderBy(asc(exams.sortOrder), desc(pyqPapers.year), asc(pyqPapers.title))
    .limit(limit);
}

export async function listPaperYears() {
  const rows = await getDb()
    .selectDistinct({ year: pyqPapers.year })
    .from(pyqPapers)
    .where(eq(pyqPapers.isPublished, true))
    .orderBy(desc(pyqPapers.year));
  return rows.map((row) => row.year);
}

export async function getPaperBySlug(slug: string) {
  const [paper] = await getDb()
    .select({
      ...paperColumns,
      description: pyqPapers.description,
      sourceUrl: pyqPapers.sourceUrl,
      examName: exams.name,
      examId: exams.id,
      updatedAt: pyqPapers.updatedAt,
    })
    .from(pyqPapers)
    .innerJoin(exams, eq(exams.id, pyqPapers.examId))
    .where(and(eq(pyqPapers.slug, slug), eq(pyqPapers.isPublished, true)))
    .limit(1);
  return paper ?? null;
}

export async function relatedPapers(examId: string, excludeId: string) {
  return getDb()
    .select(paperColumns)
    .from(pyqPapers)
    .innerJoin(exams, eq(exams.id, pyqPapers.examId))
    .where(
      and(
        eq(pyqPapers.examId, examId),
        ne(pyqPapers.id, excludeId),
        eq(pyqPapers.isPublished, true),
      ),
    )
    .orderBy(desc(pyqPapers.year))
    .limit(6);
}

const videoColumns = {
  id: prepVideos.id,
  slug: prepVideos.slug,
  title: prepVideos.title,
  youtubeId: prepVideos.youtubeId,
  description: prepVideos.description,
  topic: prepVideos.topic,
  examCode: exams.code,
  examShortName: exams.shortName,
  updatedAt: prepVideos.updatedAt,
};

export async function listVideos(exam?: ExamCode, limit = 100) {
  const conditions = [eq(prepVideos.isPublished, true)];
  if (exam) conditions.push(eq(exams.code, exam));
  return getDb()
    .select(videoColumns)
    .from(prepVideos)
    .leftJoin(exams, eq(exams.id, prepVideos.examId))
    .where(and(...conditions))
    .orderBy(asc(prepVideos.sortOrder), desc(prepVideos.createdAt))
    .limit(limit);
}

export async function getVideoBySlug(slug: string) {
  const [video] = await getDb()
    .select(videoColumns)
    .from(prepVideos)
    .leftJoin(exams, eq(exams.id, prepVideos.examId))
    .where(and(eq(prepVideos.slug, slug), eq(prepVideos.isPublished, true)))
    .limit(1);
  return video ?? null;
}

export function formatFileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
