"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, eq, payouts, users } from "@chayan/db";
import { writeAuditLog } from "@/lib/audit";
import { notifyPayoutPaid } from "@/lib/booking-emails";
import { getDb } from "@/lib/db";
import { generatePayouts, PayoutError } from "@/lib/payouts";
import { requireRole } from "@/lib/session";

export type GenerateState = {
  error?: string;
  created?: number;
  skipped?: { name: string; amountPaise: number }[];
};

export async function createPayoutsAction(
  _prev: GenerateState,
  formData: FormData,
): Promise<GenerateState> {
  const admin = await requireRole(["admin"], "/admin/payouts");
  const periodEnd = String(formData.get("periodEnd") ?? "");
  try {
    const result = await generatePayouts(periodEnd, admin.id);
    const names = result.skipped.length
      ? await getDb().select({ id: users.id, name: users.name }).from(users)
      : [];
    revalidatePath("/admin/payouts");
    return {
      created: result.created,
      skipped: result.skipped.map((item) => ({
        name: names.find((row) => row.id === item.mentorUserId)?.name ?? "Mentor",
        amountPaise: item.amountPaise,
      })),
    };
  } catch (error) {
    if (error instanceof PayoutError) return { error: error.message };
    throw error;
  }
}

export async function markPayoutPaid(formData: FormData): Promise<void> {
  const admin = await requireRole(["admin"], "/admin/payouts");
  const id = z.uuid().safeParse(formData.get("payoutId"));
  const reference = String(formData.get("reference") ?? "")
    .trim()
    .slice(0, 100);
  if (!id.success || reference.length < 4) return;

  const db = getDb();
  const [payout] = await db
    .update(payouts)
    .set({ status: "paid", reference, paidAt: new Date(), paidBy: admin.id })
    .where(and(eq(payouts.id, id.data), eq(payouts.status, "pending")))
    .returning();
  if (!payout) return;
  await writeAuditLog(db, {
    actorUserId: admin.id,
    action: "payout.paid",
    entityType: "payout",
    entityId: payout.id,
    details: { reference, netPaise: payout.netPaise },
  });
  const mentor = await db.query.users.findFirst({
    where: eq(users.id, payout.mentorUserId),
    columns: { name: true, email: true },
  });
  if (mentor) {
    await notifyPayoutPaid({
      mentorEmail: mentor.email,
      mentorName: mentor.name,
      netPaise: payout.netPaise,
      tdsPaise: payout.tdsPaise,
      periodLabel: `${payout.periodStart} to ${payout.periodEnd}`,
      reference,
    });
  }
  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/payouts/${payout.id}`);
}

export async function setPayoutHold(formData: FormData): Promise<void> {
  const admin = await requireRole(["admin"], "/admin/payouts");
  const id = z.uuid().safeParse(formData.get("payoutId"));
  const hold = formData.get("hold") === "true";
  if (!id.success) return;
  const note =
    String(formData.get("note") ?? "")
      .trim()
      .slice(0, 300) || null;
  const db = getDb();
  const [payout] = await db
    .update(payouts)
    .set({ status: hold ? "on_hold" : "pending", note: hold ? note : null })
    .where(and(eq(payouts.id, id.data), eq(payouts.status, hold ? "pending" : "on_hold")))
    .returning({ id: payouts.id });
  if (!payout) return;
  await writeAuditLog(db, {
    actorUserId: admin.id,
    action: hold ? "payout.held" : "payout.released",
    entityType: "payout",
    entityId: payout.id,
    details: { note },
  });
  revalidatePath("/admin/payouts");
  revalidatePath(`/admin/payouts/${payout.id}`);
}
