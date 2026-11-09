import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, exams, prepVideos } from "@chayan/db";
import { VideoForm } from "@/components/content/video-form";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { deleteVideo, toggleVideoPublished } from "./actions";

export const metadata: Metadata = { title: "Videos", robots: { index: false } };

export default async function AdminVideosPage() {
  await requireRole(["admin"], "/admin/videos");
  const db = getDb();
  const [examOptions, videos] = await Promise.all([
    db
      .select({ id: exams.id, shortName: exams.shortName })
      .from(exams)
      .orderBy(asc(exams.sortOrder)),
    db
      .select({
        id: prepVideos.id,
        slug: prepVideos.slug,
        title: prepVideos.title,
        youtubeId: prepVideos.youtubeId,
        isPublished: prepVideos.isPublished,
        sortOrder: prepVideos.sortOrder,
        topic: prepVideos.topic,
        exam: exams.shortName,
      })
      .from(prepVideos)
      .leftJoin(exams, eq(exams.id, prepVideos.examId))
      .orderBy(asc(prepVideos.sortOrder), desc(prepVideos.createdAt))
      .limit(300),
  ]);

  return (
    <div className="py-10">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Short prep videos</h1>
      <p className="text-ink-muted mt-2 max-w-prose">
        Upload videos to your YouTube channel (public or unlisted), then add the link here. They
        play on the site without sending viewers to YouTube.
      </p>
      <section className="border-line bg-surface panel mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Add a video</h2>
        <div className="mt-4">
          <VideoForm exams={examOptions} />
        </div>
      </section>

      <h2 className="mt-10 text-xl font-bold">All videos ({videos.length})</h2>
      {videos.length === 0 ? (
        <p className="text-ink-muted mt-4">No videos yet.</p>
      ) : (
        <ul className="divide-line border-line bg-surface mt-4 divide-y rounded-[var(--radius-control)] border">
          {videos.map((video) => (
            <li
              key={video.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <Link href={`/videos/${video.slug}`} className="text-pen font-semibold">
                  {video.title}
                </Link>
                <p className="text-ink-muted text-sm">
                  {video.exam ?? "All exams"}
                  {video.topic ? ` · ${video.topic}` : ""} · order {video.sortOrder} ·{" "}
                  {video.isPublished ? "Live" : "Hidden"}
                </p>
              </div>
              <div className="flex gap-2">
                <form action={toggleVideoPublished}>
                  <input type="hidden" name="videoId" value={video.id} />
                  <input
                    type="hidden"
                    name="publish"
                    value={video.isPublished ? "false" : "true"}
                  />
                  <Button type="submit" variant="secondary" size="sm">
                    {video.isPublished ? "Hide" : "Publish"}
                  </Button>
                </form>
                <form action={deleteVideo}>
                  <input type="hidden" name="videoId" value={video.id} />
                  <Button type="submit" variant="ghost" size="sm">
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
