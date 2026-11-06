"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { mentorPayoutAccounts } from "@chayan/db";
import {
  ACCOUNT_NUMBER_PATTERN,
  IFSC_PATTERN,
  maskTail,
  PAN_PATTERN,
  UPI_PATTERN,
} from "@chayan/shared";
import { writeAuditLog } from "@/lib/audit";
import { encryptField } from "@/lib/crypto";
import { getDb } from "@/lib/db";
import { requireMentor } from "@/lib/mentor-profile";

export type PayoutAccountState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
};

const upper = (value: unknown) =>
  String(value ?? "")
    .replace(/\s/g, "")
    .toUpperCase();

const schema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("bank"),
    accountHolderName: z
      .string()
      .trim()
      .min(3, "Enter the name exactly as on the bank account")
      .max(100),
    accountNumber: z.string().regex(ACCOUNT_NUMBER_PATTERN, "Enter a 9 to 18 digit account number"),
    confirmAccountNumber: z.string(),
    ifsc: z.string().regex(IFSC_PATTERN, "Enter an 11-character IFSC, like SBIN0001234"),
    pan: z.string().regex(PAN_PATTERN, "Enter a 10-character PAN, like ABCDE1234F"),
  }),
  z.object({
    method: z.literal("upi"),
    accountHolderName: z.string().trim().min(3, "Enter your full name as on your PAN").max(100),
    upiId: z.string().trim().regex(UPI_PATTERN, "Enter a UPI ID, like name@okaxis"),
    pan: z.string().regex(PAN_PATTERN, "Enter a 10-character PAN, like ABCDE1234F"),
  }),
]);

export async function saveMentorPayoutAccount(
  _prev: PayoutAccountState,
  formData: FormData,
): Promise<PayoutAccountState> {
  const { user, mentor } = await requireMentor("/mentor/earnings");
  const parsed = schema.safeParse({
    method: formData.get("method"),
    accountHolderName: formData.get("accountHolderName") ?? "",
    accountNumber: String(formData.get("accountNumber") ?? "").replace(/\s/g, ""),
    confirmAccountNumber: String(formData.get("confirmAccountNumber") ?? "").replace(/\s/g, ""),
    ifsc: upper(formData.get("ifsc")),
    upiId: String(formData.get("upiId") ?? "").trim(),
    pan: upper(formData.get("pan")),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { fieldErrors };
  }
  const data = parsed.data;
  if (data.method === "bank" && data.accountNumber !== data.confirmAccountNumber) {
    return { fieldErrors: { confirmAccountNumber: "The account numbers don't match" } };
  }

  const values =
    data.method === "bank"
      ? {
          method: "bank" as const,
          accountHolderName: data.accountHolderName,
          accountNumberEnc: encryptField(data.accountNumber),
          accountNumberLast4: data.accountNumber.slice(-4),
          ifsc: data.ifsc,
          upiIdEnc: null,
          upiIdMasked: null,
          panEnc: encryptField(data.pan),
          panLast4: data.pan.slice(-4),
        }
      : {
          method: "upi" as const,
          accountHolderName: data.accountHolderName,
          accountNumberEnc: null,
          accountNumberLast4: null,
          ifsc: null,
          upiIdEnc: encryptField(data.upiId),
          upiIdMasked: `${maskTail(data.upiId.split("@")[0] ?? "", 2)}@${data.upiId.split("@")[1]}`,
          panEnc: encryptField(data.pan),
          panLast4: data.pan.slice(-4),
        };

  const db = getDb();
  await db
    .insert(mentorPayoutAccounts)
    .values({ mentorUserId: mentor.userId, ...values })
    .onConflictDoUpdate({ target: mentorPayoutAccounts.mentorUserId, set: values });
  await writeAuditLog(db, {
    actorUserId: user.id,
    action: "payout_account.updated",
    entityType: "mentor",
    entityId: mentor.userId,
    details: { method: data.method },
  });
  revalidatePath("/mentor/earnings");
  return { saved: true };
}
