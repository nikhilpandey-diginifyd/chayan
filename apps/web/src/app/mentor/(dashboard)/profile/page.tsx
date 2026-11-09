import type { Metadata } from "next";
import { MentorProfileForm } from "@/components/mentor/mentor-profile-form";
import { PhotoUploader } from "@/components/mentor/photo-uploader";
import { photoUrl, requireMentor } from "@/lib/mentor-profile";

export const metadata: Metadata = { title: "Your profile", robots: { index: false } };

export default async function MentorProfilePage() {
  const { user, mentor } = await requireMentor("/mentor/profile");

  return (
    <div className="max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Your profile</h1>
      <p className="text-ink-muted mt-2">This is what aspirants see before they book you.</p>

      <section className="border-line bg-surface panel mt-8 rounded-[var(--radius-panel)] border p-6 sm:p-8">
        <h2 className="text-xl font-bold">Photo</h2>
        <div className="mt-4">
          <PhotoUploader name={user.name} url={photoUrl(mentor.photoKey)} />
        </div>
      </section>

      <section className="border-line bg-surface panel mt-8 rounded-[var(--radius-panel)] border p-6 sm:p-8">
        <MentorProfileForm
          stages={mentor.stages}
          initial={{
            headline: mentor.headline ?? "",
            bio: mentor.bio,
            languages: mentor.languages,
            focusAreas: mentor.focusAreas,
            stageCodes: mentor.stageCodes,
          }}
        />
      </section>
    </div>
  );
}
