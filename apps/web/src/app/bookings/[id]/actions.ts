"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BookingError, cancelBooking, rescheduleBooking, type CancelActor } from "@/lib/bookings";
import { getBookingDetail } from "@/lib/booking-queries";
import { requireUser } from "@/lib/session";

export type BookingActionState = { error?: string; done?: string };

export async function cancelBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const bookingId = z.uuid().safeParse(formData.get("bookingId"));
  if (!bookingId.success) return { error: "Booking not found." };
  const user = await requireUser(`/bookings/${bookingId.data}`);
  const booking = await getBookingDetail(bookingId.data);
  if (!booking) return { error: "Booking not found." };

  const actor: CancelActor | null =
    booking.aspirantUserId === user.id
      ? "aspirant"
      : booking.mentorUserId === user.id
        ? "mentor"
        : user.role === "admin"
          ? "admin"
          : null;
  if (!actor) return { error: "You can't cancel this booking." };

  const reason =
    String(formData.get("reason") ?? "")
      .trim()
      .slice(0, 500) || null;
  if (actor === "mentor" && !reason) {
    return { error: "Tell the aspirant briefly why you're cancelling." };
  }

  try {
    await cancelBooking({ bookingId: booking.id, actor, actorUserId: user.id, reason });
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/bookings/${booking.id}`);
  revalidatePath("/bookings");
  revalidatePath("/mentor", "layout");
  return { done: "cancelled" };
}

export async function rescheduleBookingAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const bookingId = z.uuid().safeParse(formData.get("bookingId"));
  const startsAt = z.iso.datetime().safeParse(formData.get("startsAt"));
  if (!bookingId.success || !startsAt.success) return { error: "Choose a new time." };
  const user = await requireUser(`/bookings/${bookingId.data}`);

  try {
    await rescheduleBooking({
      bookingId: bookingId.data,
      aspirantUserId: user.id,
      newStartsAt: new Date(startsAt.data),
    });
  } catch (error) {
    if (error instanceof BookingError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/bookings/${bookingId.data}`);
  revalidatePath("/bookings");
  return { done: "rescheduled" };
}
