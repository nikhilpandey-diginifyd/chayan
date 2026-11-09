import type { Metadata } from "next";
import { AvailabilityEditor } from "@/components/mentor/availability-editor";
import { requireMentor } from "@/lib/mentor-profile";

export const metadata: Metadata = { title: "Availability", robots: { index: false } };

export default async function MentorAvailabilityPage() {
  const { mentor } = await requireMentor("/mentor/availability");
  const shortest = mentor.services
    .filter((service) => service.isActive)
    .reduce<number | null>(
      (min, service) =>
        min === null ? service.durationMinutes : Math.min(min, service.durationMinutes),
      null,
    );

  return (
    <div className="max-w-4xl py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Availability</h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        Set the hours you&apos;re usually free each week, in Indian Standard Time. Aspirants can
        only book inside these hours.
      </p>
      <div className="mt-8">
        <AvailabilityEditor
          previewDuration={shortest ?? 30}
          initial={{
            rules: mentor.availabilityRules.map(({ weekday, startMinute, endMinute }) => ({
              weekday,
              startMinute,
              endMinute,
            })),
            blockedDates: mentor.blockedDates.map((row) => row.date),
            bufferMinutes: mentor.bufferMinutes,
            minNoticeHours: mentor.minNoticeHours,
            bookingWindowDays: mentor.bookingWindowDays,
          }}
        />
      </div>
    </div>
  );
}
