import { getParticipant } from "@/lib/session-access";
import { ensureVideoRoom, isJoinOpen, joinWindow, recordPresence } from "@/lib/sessions";
import { createAuthToken, isVideoConfigured } from "@/lib/video/hms";

export const runtime = "nodejs";

/** Returns what the browser needs to join the call for this booking. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await getParticipant(request, id);
  if (!participant) return Response.json({ error: "Not found" }, { status: 404 });

  const { booking, role, user } = participant;
  if (!isJoinOpen(booking)) {
    return Response.json({ error: "The call isn't open right now." }, { status: 409 });
  }

  if (!isVideoConfigured()) {
    await recordPresence({ bookingId: booking.id, role, at: new Date(), source: "client" });
    return Response.json({ mode: "test", role, userName: user.name });
  }

  try {
    const roomId = await ensureVideoRoom(booking.id);
    const closesAt = joinWindow(booking).closesAt;
    const token = await createAuthToken({
      roomId,
      userId: user.id,
      role,
      validForSeconds: Math.ceil((closesAt.getTime() - Date.now()) / 1000),
    });
    return Response.json({ mode: "hms", role, userName: user.name, token });
  } catch (error) {
    console.error("Could not prepare the video room", error);
    return Response.json(
      { error: "We couldn't start the call. Try again in a few seconds." },
      { status: 502 },
    );
  }
}
