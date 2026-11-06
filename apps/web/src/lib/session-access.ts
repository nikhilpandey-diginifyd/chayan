import "server-only";
import { bookings, eq } from "@chayan/db";
import { getAuth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import type { SessionRole } from "@/lib/sessions";

/** The signed-in participant of a booking, or null for anyone else. */
export async function getParticipant(request: Request, bookingId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(bookingId)) return null;
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) return null;
  const [booking] = await getDb().select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking) return null;
  const role: SessionRole | null =
    booking.mentorUserId === session.user.id
      ? "mentor"
      : booking.aspirantUserId === session.user.id
        ? "aspirant"
        : null;
  if (!role) return null;
  return { booking, role, user: session.user };
}
