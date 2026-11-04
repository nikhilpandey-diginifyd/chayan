import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { eq, mentorProfiles } from "@chayan/db";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { detectContentType, getStorage } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;

function fail(status: number, error: string) {
  return Response.json({ error }, { status });
}

/**
 * Replaces the signed-in mentor's profile photo. The image is re-encoded as a
 * 400×400 WebP, which also strips location and camera data from the file.
 */
export async function POST(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return fail(401, "Sign in to upload a photo.");

  const db = getDb();
  const profile = await db.query.mentorProfiles.findFirst({
    where: eq(mentorProfiles.userId, session.user.id),
    columns: { userId: true, photoKey: true },
  });
  if (!profile) return fail(403, "Only verified mentors can upload a profile photo.");

  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES + 64 * 1024) {
    return fail(413, "Use a photo of 5 MB or less.");
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return fail(400, "Upload didn't arrive. Try again.");
  }
  if (!(file instanceof File) || file.size === 0) return fail(400, "Choose a photo.");
  if (file.size > MAX_BYTES) return fail(413, "Use a photo of 5 MB or less.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectContentType(bytes);
  if (!type || type === "application/pdf") return fail(415, "Use a JPG, PNG or WebP photo.");

  let output: Uint8Array<ArrayBuffer>;
  try {
    const buffer = await sharp(bytes, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(400, 400, { fit: "cover", position: "attention" })
      .webp({ quality: 82 })
      .toBuffer();
    output = new Uint8Array(buffer);
  } catch {
    return fail(415, "We couldn't read that image. Try a different photo.");
  }

  const key = `mentor-photos/${profile.userId}/${randomUUID()}.webp`;
  const storage = getStorage();
  await storage.put(key, output, "image/webp");
  await db
    .update(mentorProfiles)
    .set({ photoKey: key })
    .where(eq(mentorProfiles.userId, profile.userId));
  if (profile.photoKey) await storage.delete(profile.photoKey).catch(() => {});

  return Response.json({ ok: true }, { status: 201 });
}
