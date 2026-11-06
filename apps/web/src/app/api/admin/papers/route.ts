import { randomUUID } from "node:crypto";
import { z } from "zod";
import { eq, exams, pyqPapers } from "@chayan/db";
import { CONTENT_LIMITS, PAPER_LANGUAGES } from "@chayan/shared";
import { userRoleSchema } from "@chayan/shared";
import { writeAuditLog } from "@/lib/audit";
import { getAuth } from "@/lib/auth";
import { uniqueSlug } from "@/lib/content";
import { getDb } from "@/lib/db";
import { detectContentType, getStorage } from "@/lib/storage";

export const runtime = "nodejs";

const fieldsSchema = z.object({
  examId: z.uuid("Choose the exam"),
  year: z.coerce.number<string>().int().min(1990, "Enter the year").max(2100, "Enter the year"),
  title: z.string().trim().min(3, "Enter a title").max(150),
  language: z.enum(PAPER_LANGUAGES, "Choose the language"),
  description: z.string().trim().max(1000).optional(),
  sourceUrl: z
    .string()
    .trim()
    .max(500)
    .transform((value) => value || undefined)
    .pipe(
      z.url({ protocol: /^https?$/, error: "Use a full link starting with https://" }).optional(),
    ),
});

async function readPdf(file: FormDataEntryValue | null, label: string) {
  if (!(file instanceof File) || file.size === 0) return { error: `Choose the ${label} PDF.` };
  if (file.size > CONTENT_LIMITS.paperMaxBytes)
    return { error: `The ${label} must be 20 MB or smaller.` };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (detectContentType(bytes) !== "application/pdf")
    return { error: `The ${label} must be a PDF.` };
  return { bytes };
}

/** Admin upload of a previous year paper, with an optional answer key. */
export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session || userRoleSchema.catch("aspirant").parse(session.user.role) !== "admin") {
    return Response.json({ error: "Not allowed" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Upload didn't arrive. Try again." }, { status: 400 });
  }

  const parsed = fieldsSchema.safeParse({
    examId: form.get("examId") ?? "",
    year: form.get("year") ?? "",
    title: form.get("title") ?? "",
    language: form.get("language") ?? "",
    description: form.get("description") ?? undefined,
    sourceUrl: form.get("sourceUrl") ?? "",
  });
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form." },
      { status: 400 },
    );
  }

  const db = getDb();
  const [exam] = await db.select().from(exams).where(eq(exams.id, parsed.data.examId)).limit(1);
  if (!exam) return Response.json({ error: "Choose the exam" }, { status: 400 });

  const paper = await readPdf(form.get("file"), "paper");
  if ("error" in paper) return Response.json({ error: paper.error }, { status: 400 });
  const keyEntry = form.get("answerKey");
  const answerKey =
    keyEntry instanceof File && keyEntry.size > 0 ? await readPdf(keyEntry, "answer key") : null;
  if (answerKey && "error" in answerKey) {
    return Response.json({ error: answerKey.error }, { status: 400 });
  }

  const id = randomUUID();
  const storageKey = `papers/${id}/paper.pdf`;
  const answerKeyStorageKey = answerKey ? `papers/${id}/answer-key.pdf` : null;
  const storage = getStorage();
  await storage.put(storageKey, paper.bytes, "application/pdf");
  if (answerKey && answerKeyStorageKey) {
    await storage.put(answerKeyStorageKey, answerKey.bytes, "application/pdf");
  }

  const slug = await uniqueSlug(
    `${exam.shortName} ${parsed.data.year} ${parsed.data.title} ${parsed.data.language === "english" ? "" : parsed.data.language}`,
    pyqPapers,
  );
  await db.insert(pyqPapers).values({
    id,
    examId: exam.id,
    year: parsed.data.year,
    title: parsed.data.title,
    slug,
    language: parsed.data.language,
    description: parsed.data.description || null,
    sourceUrl: parsed.data.sourceUrl ?? null,
    storageKey,
    fileSizeBytes: paper.bytes.byteLength,
    answerKeyStorageKey,
    uploadedBy: session.user.id,
  });
  await writeAuditLog(db, {
    actorUserId: session.user.id,
    action: "paper.uploaded",
    entityType: "pyq_paper",
    entityId: id,
    details: { slug },
  });

  return Response.json({ id, slug }, { status: 201 });
}
