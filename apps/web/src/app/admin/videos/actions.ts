"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, prepVideos } from "@chayan/db";
import { parseYouTubeId } from "@chayan/shared";
import { writeAuditLog } from "@/lib/audit";
import { uniqueSlug } from "@/lib/content";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";

export type VideoFormState = { error?: string; done?: boolean };

const schema = z.object({
  url: z.string().trim().min(5, "Paste a YouTube link"),
  title: z.string().trim().min(5, "Write a title of at least 5 characters").max(150),
  examId: z.string().trim(),
  topic: z.string().trim().max(60).optional(),
  description: z.string().trim().max(1000).optional(),
  sortOrder: z.coerce.number<string>().int().min(0).max(9999).catch(0),
});

export async function addVideo(_prev: VideoFormState, formData: FormData): Promise<VideoFormState> {
  const admin = await requireRole(["admin"], "/admin/videos");
  const parsed = schema.safeParse({
    url: formData.get("url") ?? "",
    title: formData.get("title") ?? "",
    examId: formData.get("examId") ?? "",
    topic: formData.get("topic") ?? undefined,
    description: formData.get("description") ?? undefined,
    sortOrder: formData.get("sortOrder") ?? "0",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };

  const youtubeId = parseYouTubeId(parsed.data.url);
  if (!youtubeId) return { error: "That doesn't look like a YouTube video link." };
  const examId = z.uuid().safeParse(parsed.data.examId).success ? parsed.data.examId : null;

  const db = getDb();
  const slug = await uniqueSlug(parsed.data.title, prepVideos);
  const [video] = await db
    .insert(prepVideos)
    .values({
      youtubeId,
      title: parsed.data.title,
      slug,
      examId,
      topic: parsed.data.topic || null,
      description: parsed.data.description || null,
      sortOrder: parsed.data.sortOrder,
    })
    .returning({ id: prepVideos.id });
  await writeAuditLog(db, {
    actorUserId: admin.id,
    action: "video.added",
    entityType: "prep_video",
    entityId: video!.id,
    details: { youtubeId, slug },
  });
  revalidatePath("/admin/videos");
  revalidatePath("/videos", "layout");
  return { done: true };
}

export async function toggleVideoPublished(formData: FormData): Promise<void> {
  await requireRole(["admin"], "/admin/videos");
  const id = z.uuid().safeParse(formData.get("videoId"));
  if (!id.success) return;
  await getDb()
    .update(prepVideos)
    .set({ isPublished: formData.get("publish") === "true" })
    .where(eq(prepVideos.id, id.data));
  revalidatePath("/admin/videos");
  revalidatePath("/videos", "layout");
}

export async function deleteVideo(formData: FormData): Promise<void> {
  await requireRole(["admin"], "/admin/videos");
  const id = z.uuid().safeParse(formData.get("videoId"));
  if (!id.success) return;
  await getDb().delete(prepVideos).where(eq(prepVideos.id, id.data));
  revalidatePath("/admin/videos");
  revalidatePath("/videos", "layout");
}
