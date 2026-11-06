"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq, pyqPapers } from "@chayan/db";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { getStorage } from "@/lib/storage";

export async function togglePaperPublished(formData: FormData): Promise<void> {
  await requireRole(["admin"], "/admin/papers");
  const id = z.uuid().safeParse(formData.get("paperId"));
  if (!id.success) return;
  await getDb()
    .update(pyqPapers)
    .set({ isPublished: formData.get("publish") === "true" })
    .where(eq(pyqPapers.id, id.data));
  revalidatePath("/admin/papers");
  revalidatePath("/papers", "layout");
}

export async function deletePaper(formData: FormData): Promise<void> {
  const admin = await requireRole(["admin"], "/admin/papers");
  const id = z.uuid().safeParse(formData.get("paperId"));
  if (!id.success) return;
  const db = getDb();
  const [paper] = await db.delete(pyqPapers).where(eq(pyqPapers.id, id.data)).returning();
  if (!paper) return;
  const storage = getStorage();
  await storage.delete(paper.storageKey).catch(() => {});
  if (paper.answerKeyStorageKey) await storage.delete(paper.answerKeyStorageKey).catch(() => {});
  await writeAuditLog(db, {
    actorUserId: admin.id,
    action: "paper.deleted",
    entityType: "pyq_paper",
    entityId: paper.id,
    details: { slug: paper.slug, title: paper.title },
  });
  revalidatePath("/admin/papers");
  revalidatePath("/papers", "layout");
}
