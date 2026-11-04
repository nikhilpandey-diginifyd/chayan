import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { AwsClient } from "aws4fetch";
import { getServerEnv } from "@/env";

/**
 * Private file storage. Files are never public: they are read back only
 * through our own route handlers after a permission check.
 *
 * - Production: Cloudflare R2 (S3-compatible API).
 * - Local development without R2 settings: the `.uploads` folder in apps/web.
 */
export interface FileStorage {
  put(key: string, body: Uint8Array<ArrayBuffer>, contentType: string): Promise<void>;
  get(key: string): Promise<Uint8Array<ArrayBuffer> | null>;
  delete(key: string): Promise<void>;
}

function assertSafeKey(key: string) {
  if (!/^[a-z0-9][a-z0-9/_.-]*$/i.test(key) || key.includes("..")) {
    throw new Error(`Unsafe storage key: ${key}`);
  }
}

class LocalStorage implements FileStorage {
  constructor(private readonly root: string) {}

  private resolve(key: string) {
    assertSafeKey(key);
    return path.join(this.root, key);
  }

  async put(key: string, body: Uint8Array<ArrayBuffer>) {
    const file = this.resolve(key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, body);
  }

  async get(key: string) {
    try {
      return new Uint8Array(await readFile(this.resolve(key)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }
}

class R2Storage implements FileStorage {
  private readonly client: AwsClient;
  private readonly baseUrl: string;

  constructor(options: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
  }) {
    this.client = new AwsClient({
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey,
      service: "s3",
      region: "auto",
    });
    this.baseUrl = `https://${options.accountId}.r2.cloudflarestorage.com/${options.bucket}`;
  }

  private url(key: string) {
    assertSafeKey(key);
    return `${this.baseUrl}/${key.split("/").map(encodeURIComponent).join("/")}`;
  }

  async put(key: string, body: Uint8Array<ArrayBuffer>, contentType: string) {
    const response = await this.client.fetch(this.url(key), {
      method: "PUT",
      body,
      headers: { "Content-Type": contentType },
    });
    if (!response.ok) {
      throw new Error(`R2 upload failed (${response.status}): ${await response.text()}`);
    }
  }

  async get(key: string) {
    const response = await this.client.fetch(this.url(key), { method: "GET" });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`R2 download failed (${response.status}): ${await response.text()}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  async delete(key: string) {
    const response = await this.client.fetch(this.url(key), { method: "DELETE" });
    if (!response.ok && response.status !== 404) {
      throw new Error(`R2 delete failed (${response.status}): ${await response.text()}`);
    }
  }
}

const globalForStorage = globalThis as unknown as { storage?: FileStorage };

export function getStorage(): FileStorage {
  if (globalForStorage.storage) return globalForStorage.storage;

  const env = getServerEnv();
  if (env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET) {
    globalForStorage.storage = new R2Storage({
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET,
    });
  } else {
    globalForStorage.storage = new LocalStorage(path.join(process.cwd(), ".uploads"));
  }
  return globalForStorage.storage;
}

/** Detects the real file type from its first bytes instead of trusting the browser. */
export function detectContentType(bytes: Uint8Array): string | null {
  const startsWith = (signature: number[], offset = 0) =>
    signature.every((byte, index) => bytes[offset + index] === byte);

  if (startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf"; // %PDF-
  if (startsWith([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith([0x52, 0x49, 0x46, 0x46]) && startsWith([0x57, 0x45, 0x42, 0x50], 8)) {
    return "image/webp";
  }
  return null;
}

export const EXTENSION_FOR_TYPE: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
