import type { Metadata } from "next";
import { PLATFORM_FEE_PERCENT } from "@chayan/shared";
import { ServicesForm } from "@/components/mentor/services-form";
import { requireMentor } from "@/lib/mentor-profile";

export const metadata: Metadata = { title: "Sessions and prices", robots: { index: false } };

export default async function MentorSessionsPage() {
  const { mentor } = await requireMentor("/mentor/sessions");

  return (
    <div className="max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold">Sessions and prices</h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        Choose which session lengths you offer and what each costs. Aspirants pay exactly this
        price. You receive {100 - PLATFORM_FEE_PERCENT}% after our {PLATFORM_FEE_PERCENT}% platform
        fee, before any tax deducted at source.
      </p>
      <section className="border-line bg-surface mt-8 rounded-[var(--radius-panel)] border p-6 sm:p-8">
        <ServicesForm
          initial={mentor.services.map((service) => ({
            durationMinutes: service.durationMinutes,
            rupees: service.pricePaise / 100,
            isActive: service.isActive,
          }))}
        />
      </section>
    </div>
  );
}
