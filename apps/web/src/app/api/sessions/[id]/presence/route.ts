import { getParticipant } from "@/lib/session-access";
import { isJoinOpen, recordPresence } from "@/lib/sessions";

export const runtime = "nodejs";

/** Heartbeat from the call page every 30 seconds while a participant is connected. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await getParticipant(request, id);
  if (!participant) return new Response(null, { status: 404 });
  if (!isJoinOpen(participant.booking)) return new Response(null, { status: 409 });
  await recordPresence({
    bookingId: participant.booking.id,
    role: participant.role,
    at: new Date(),
    source: "client",
  });
  return new Response(null, { status: 204 });
}
