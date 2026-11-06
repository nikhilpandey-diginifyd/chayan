import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { getServerEnv } from "@/env";

/**
 * Field encryption for bank details and PAN (AES-256-GCM).
 * Production uses PAYOUT_ENCRYPTION_KEY. Locally, a key is derived from
 * BETTER_AUTH_SECRET so development works without extra setup.
 * Changing the key makes existing values unreadable, so back it up.
 */
function key(): Buffer {
  const env = getServerEnv();
  if (env.PAYOUT_ENCRYPTION_KEY) return Buffer.from(env.PAYOUT_ENCRYPTION_KEY, "base64");
  return createHash("sha256").update(`payout-dev:${env.BETTER_AUTH_SECRET}`).digest();
}

export function encryptField(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    data.toString("base64"),
  ].join(":");
}

export function decryptField(stored: string | null): string | null {
  if (!stored) return null;
  const [version, iv, tag, data] = stored.split(":");
  if (version !== "v1" || !iv || !tag || !data) throw new Error("Unknown encrypted value format");
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString(
    "utf8",
  );
}
