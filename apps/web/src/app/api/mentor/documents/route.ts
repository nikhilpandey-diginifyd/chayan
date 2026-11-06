import { createHash, randomUUID } from "node:crypto";
import { count, eq, mentorApplications, mentorDocuments } from "@chayan/db";
import { MENTOR_DOCUMENT_LIMITS, mentorDocumentKindSchema } from "@chayan/shared";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { EDITABLE_STATUSES } from "@/lib/mentor-applications";
import { consumeRateLimit, tooManyRequests } from "@/lib/rate-limit";
import { detectContentType, EXTENSION_FOR_TYPE, getStorage } from "@/lib/storage";

export const runtime = "nodejs";

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

function cleanFileName(name: string) {
  const cleaned = name
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}._ -]/gu, "")
    .trim()
    .slice(0, 120);
  return cleaned || "document";
}

/** Uploads one verification document for the signed-in user's application. */
export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return fail(401, "Sign in to upload documents.");
  const limited = await consumeRateLimit("mentorDocumentUpload", session.user.id);
  if (!limited.allowed) return tooManyRequests(limited.retryAfterSeconds);

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MENTOR_DOCUMENT_LIMITS.maxBytes + 64 * 1024) {
    return fail(413, "Files must be 5 MB or smaller.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "Upload didn't arrive. Try again.");
  }

  const kind = mentorDocumentKindSchema.safeParse(form.get("kind"));
  if (!kind.success) return fail(400, "Choose what this document is.");

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose a file to upload.");
  if (file.size > MENTOR_DOCUMENT_LIMITS.maxBytes)
    return fail(413, "Files must be 5 MB or smaller.");

  const db = getDb();
  const application = await db.query.mentorApplications.findFirst({
    where: eq(mentorApplications.userId, session.user.id),
    columns: { id: true, status: true },
  });
  if (!application) return fail(400, "Save your details before uploading documents.");
  if (!EDITABLE_STATUSES.includes(application.status)) {
    return fail(409, "Your application is under review and can't be changed right now.");
  }

  const [existing] = await db
    .select({ total: count() })
    .from(mentorDocuments)
    .where(eq(mentorDocuments.applicationId, application.id));
  if ((existing?.total ?? 0) >= MENTOR_DOCUMENT_LIMITS.maxPerApplication) {
    return fail(409, "You've reached the limit of 10 documents. Remove one to add another.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectContentType(bytes);
  if (!contentType) return fail(415, "Upload a PDF, JPG, PNG or WebP file.");

  const id = randomUUID();
  const storageKey = `mentor-documents/${application.id}/${id}.${EXTENSION_FOR_TYPE[contentType]}`;
  const sha256 = createHash("sha256").update(bytes).digest("hex");

  await getStorage().put(storageKey, bytes, contentType);
  try {
    await db.insert(mentorDocuments).values({
      id,
      applicationId: application.id,
      kind: kind.data,
      storageKey,
      fileName: cleanFileName(file.name),
      contentType,
      sizeBytes: bytes.byteLength,
      sha256,
    });
  } catch (error) {
    await getStorage()
      .delete(storageKey)
      .catch(() => {});
    throw error;
  }

  return Response.json({ id }, { status: 201 });
}
