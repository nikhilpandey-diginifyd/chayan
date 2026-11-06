"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { BOOKING_POLICY, SESSION_DURATIONS } from "@chayan/shared";
import { BookingError, createPendingBooking } from "@/lib/bookings";
import { getPublicMentor } from "@/lib/mentor-directory";
import { consumeRateLimit } from "@/lib/rate-limit";
import { requireUser } from "@/lib/session";

export type BookState = { error?: string };

const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,60}$/),
  durationMinutes: z.coerce
    .number<string>()
    .refine((value) => (SESSION_DURATIONS as readonly number[]).includes(value)),
  startsAt: z.iso.datetime(),
  note: z.string().trim().max(BOOKING_POLICY.noteMaxLength).optional(),
});

export async function bookSession(_prev: BookState, formData: FormData): Promise<BookState> {
  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    durationMinutes: formData.get("durationMinutes"),
    startsAt: formData.get("startsAt"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { error: "Choose a session length and time." };

  const user = await requireUser(`/mentors/${parsed.data.slug}`);
  const limited = await consumeRateLimit("createBooking", user.id);
  if (!limited.allowed)
    return { error: "Too many booking attempts. Wait a few minutes and try again." };
  const mentor = await getPublicMentor(parsed.data.slug);
  if (!mentor) return { error: "This mentor isn't taking bookings right now." };

  let bookingId: string;
  try {
    ({ bookingId } = await createPendingBooking({
      aspirantUserId: user.id,
      mentorUserId: mentor.userId,
      durationMinutes: parsed.data.durationMinutes,
      startsAt: new Date(parsed.data.startsAt),
      note: parsed.data.note || null,
    }));
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    throw error;
  }
  redirect(`/bookings/${bookingId}/pay`);
}
