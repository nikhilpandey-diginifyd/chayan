"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "@chayan/db";
import { bookings } from "@chayan/db";
import { REVIEW_POLICY } from "@chayan/shared";
import { BookingError, cancelBooking, rescheduleBooking, type CancelActor } from "@/lib/bookings";
import { getDb } from "@/lib/db";
import { ReviewError, saveReview } from "@/lib/reviews";
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

export async function saveReviewAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const bookingId = z.uuid().safeParse(formData.get("bookingId"));
  if (!bookingId.success) return { error: "Booking not found." };
  const user = await requireUser(`/bookings/${bookingId.data}`);
  const camera = String(formData.get("mentorOnCamera") ?? "");

  try {
    await saveReview({
      bookingId: bookingId.data,
      aspirantUserId: user.id,
      rating: Number(formData.get("rating")),
      tags: formData.getAll("tags").map(String),
      comment: String(formData.get("comment") ?? ""),
      mentorOnCamera: camera === "yes" || camera === "no" || camera === "partly" ? camera : null,
    });
  } catch (error) {
    if (error instanceof ReviewError) return { error: error.message };
    throw error;
  }
  revalidatePath(`/bookings/${bookingId.data}`);
  revalidatePath("/mentors", "layout");
  return { done: "reviewed" };
}

export async function saveSessionNotesAction(
  _prev: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const bookingId = z.uuid().safeParse(formData.get("bookingId"));
  if (!bookingId.success) return { error: "Booking not found." };
  const user = await requireUser(`/bookings/${bookingId.data}`);
  const booking = await getBookingDetail(bookingId.data);
  if (!booking || booking.mentorUserId !== user.id) return { error: "Booking not found." };
  if (booking.startsAt.getTime() > Date.now()) {
    return { error: "You can add notes once the session has started." };
  }
  if (!["confirmed", "completed"].includes(booking.status)) {
    return { error: "Notes can only be added to sessions that took place." };
  }

  const summary = String(formData.get("sessionSummary") ?? "")
    .trim()
    .slice(0, REVIEW_POLICY.notesMaxLength);
  const nextSteps = String(formData.get("nextSteps") ?? "")
    .trim()
    .slice(0, REVIEW_POLICY.notesMaxLength);
  if (!summary && !nextSteps) return { error: "Write a summary or next steps first." };

  await getDb()
    .update(bookings)
    .set({
      sessionSummary: summary || null,
      nextSteps: nextSteps || null,
      notesUpdatedAt: new Date(),
    })
    .where(eq(bookings.id, booking.id));
  revalidatePath(`/bookings/${booking.id}`);
  return { done: "notes" };
}
