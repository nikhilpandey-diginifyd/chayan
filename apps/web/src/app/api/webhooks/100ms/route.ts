import { timingSafeEqual } from "node:crypto";
import { bookings, eq } from "@chayan/db";
import { getServerEnv } from "@/env";
import { getDb } from "@/lib/db";
import { recordPresence } from "@/lib/sessions";

export const runtime = "nodejs";

type HmsEvent = {
  type?: string;
  data?: { room_id?: string; user_id?: string; role?: string; joined_at?: string };
};

function sameSecret(expected: string, received: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * 100ms webhook. In the 100ms dashboard (Developer > Webhooks) set the URL to
 * <site>/api/webhooks/100ms and add a header `x-webhook-secret` with the value
 * of HMS_WEBHOOK_SECRET. Join events become the source of truth for no-shows.
 */
export async function POST(request: Request) {
  const secret = getServerEnv().HMS_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });
  if (!sameSecret(secret, request.headers.get("x-webhook-secret") ?? "")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const event = (await request.json().catch(() => null)) as HmsEvent | null;
  if (!event?.type || !event.data?.room_id) return Response.json({ ok: true });

  if (event.type === "peer.join.success" && event.data.user_id) {
    const [booking] = await getDb()
      .select()
      .from(bookings)
      .where(eq(bookings.videoRoomId, event.data.room_id));
    if (booking) {
      const role =
        event.data.user_id === booking.mentorUserId
          ? "mentor"
          : event.data.user_id === booking.aspirantUserId
            ? "aspirant"
            : null;
      if (role) {
        const joinedAt = event.data.joined_at ? new Date(event.data.joined_at) : new Date();
        await recordPresence({
          bookingId: booking.id,
          role,
          at: Number.isNaN(joinedAt.getTime()) ? new Date() : joinedAt,
          source: "provider",
        });
      }
    }
  }
  return Response.json({ ok: true });
}
