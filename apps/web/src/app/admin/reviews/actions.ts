"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { setReviewHidden } from "@/lib/reviews";
import { requireRole } from "@/lib/session";

export async function toggleReviewVisibility(formData: FormData): Promise<void> {
  const admin = await requireRole(["admin"], "/admin/reviews");
  const reviewId = z.uuid().safeParse(formData.get("reviewId"));
  const hide = formData.get("hide") === "true";
  if (!reviewId.success) return;
  const reason =
    String(formData.get("reason") ?? "")
      .trim()
      .slice(0, 300) || null;

  await setReviewHidden(reviewId.data, hide, reason);
  await writeAuditLog(getDb(), {
    actorUserId: admin.id,
    action: hide ? "review.hidden" : "review.restored",
    entityType: "review",
    entityId: reviewId.data,
    details: { reason },
  });
  revalidatePath("/admin/reviews");
  revalidatePath("/mentors", "layout");
}
