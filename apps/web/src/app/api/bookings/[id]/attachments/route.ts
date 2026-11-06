import { randomUUID } from "node:crypto";
import { asc, bookingAttachments, count, eq } from "@chayan/db";
import { getDb } from "@/lib/db";
import { consumeRateLimit, tooManyRequests } from "@/lib/rate-limit";
import { getParticipant } from "@/lib/session-access";
import { detectContentType, EXTENSION_FOR_TYPE, getStorage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_FILES = 20;

/** Files shared in this session, newest last. Participants only. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await getParticipant(request, id);
  if (!participant) return Response.json({ error: "Not found" }, { status: 404 });
  const rows = await getDb()
    .select({
      id: bookingAttachments.id,
      fileName: bookingAttachments.fileName,
      contentType: bookingAttachments.contentType,
      uploadedBy: bookingAttachments.uploadedBy,
      createdAt: bookingAttachments.createdAt,
    })
    .from(bookingAttachments)
    .where(eq(bookingAttachments.bookingId, id))
    .orderBy(asc(bookingAttachments.createdAt));
  return Response.json(
    rows.map((row) => ({ ...row, mine: row.uploadedBy === participant.user.id })),
    { headers: { "Cache-Control": "no-store" } },
  );
}

/** Share a photo or PDF (for example an answer copy) with the other participant. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await getParticipant(request, id);
  if (!participant) return Response.json({ error: "Not found" }, { status: 404 });
  if (participant.booking.status !== "confirmed" && participant.booking.status !== "completed") {
    return Response.json(
      { error: "Files can only be shared for active sessions." },
      { status: 409 },
    );
  }
  const limited = await consumeRateLimit("sessionFileUpload", participant.user.id);
  if (!limited.allowed) return tooManyRequests(limited.retryAfterSeconds);

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return Response.json({ error: "Upload didn't arrive. Try again." }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Choose a file." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "Files must be 5 MB or smaller." }, { status: 413 });
  }

  const db = getDb();
  const [existing] = await db
    .select({ total: count() })
    .from(bookingAttachments)
    .where(eq(bookingAttachments.bookingId, id));
  if ((existing?.total ?? 0) >= MAX_FILES) {
    return Response.json({ error: "This session has reached 20 shared files." }, { status: 409 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = detectContentType(bytes);
  if (!contentType) {
    return Response.json({ error: "Share a photo (JPG, PNG, WebP) or a PDF." }, { status: 415 });
  }

  const attachmentId = randomUUID();
  const storageKey = `session-files/${id}/${attachmentId}.${EXTENSION_FOR_TYPE[contentType]}`;
  await getStorage().put(storageKey, bytes, contentType);
  await db.insert(bookingAttachments).values({
    id: attachmentId,
    bookingId: id,
    uploadedBy: participant.user.id,
    storageKey,
    fileName: file.name.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 120) || "file",
    contentType,
    sizeBytes: bytes.byteLength,
  });
  return Response.json({ id: attachmentId }, { status: 201 });
}
