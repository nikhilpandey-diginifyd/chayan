import "server-only";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { getServerEnv } from "@/env";

/**
 * 100ms server API. Docs: https://www.100ms.live/docs/server-side/v2/introduction/basics
 * Rooms are created per booking from one template that has two roles:
 * "mentor" and "aspirant", both allowed to publish audio, video and screen.
 */
const API = "https://api.100ms.live/v2";

function config() {
  const env = getServerEnv();
  if (!env.HMS_ACCESS_KEY || !env.HMS_SECRET || !env.HMS_TEMPLATE_ID) return null;
  return {
    accessKey: env.HMS_ACCESS_KEY,
    secret: new TextEncoder().encode(env.HMS_SECRET),
    templateId: env.HMS_TEMPLATE_ID,
  };
}

export function isVideoConfigured(): boolean {
  return config() !== null;
}

async function managementToken() {
  const c = config();
  if (!c) throw new Error("100ms is not configured");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ access_key: c.accessKey, type: "management", version: 2 })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + 300)
    .setJti(randomUUID())
    .sign(c.secret);
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await managementToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await response.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!response.ok || !data) {
    throw new Error(`100ms ${path} failed (${response.status}): ${data?.message ?? "no details"}`);
  }
  return data;
}

export async function createRoom(name: string): Promise<string> {
  const c = config();
  if (!c) throw new Error("100ms is not configured");
  const room = await request<{ id: string }>("/rooms", {
    name: name.slice(0, 80),
    template_id: c.templateId,
  });
  return room.id;
}

/** Ends an active call and locks the room so nobody can rejoin. */
export async function endRoom(roomId: string, reason: string) {
  try {
    await request(`/active-rooms/${encodeURIComponent(roomId)}/end-room`, { reason, lock: true });
  } catch (error) {
    // 404 means nobody is in the room, which is fine.
    if (!String(error).includes("(404)")) throw error;
  }
}

export async function createAuthToken(input: {
  roomId: string;
  userId: string;
  role: "mentor" | "aspirant";
  validForSeconds: number;
}): Promise<string> {
  const c = config();
  if (!c) throw new Error("100ms is not configured");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    access_key: c.accessKey,
    room_id: input.roomId,
    user_id: input.userId,
    role: input.role,
    type: "app",
    version: 2,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(now)
    .setNotBefore(now)
    .setExpirationTime(now + Math.max(60, input.validForSeconds))
    .setJti(randomUUID())
    .sign(c.secret);
}
