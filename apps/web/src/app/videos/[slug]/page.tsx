import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ExamCode } from "@chayan/shared";
import { Lock, PlayCircle } from "lucide-react";
import { YouTubeEmbed, youtubeThumbnail } from "@/components/content/youtube-embed";
import { ButtonLink } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getVideoBySlug, listVideos } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const video = await getVideoBySlug(slug);
  if (!video) return { title: "Video not found", robots: { index: false } };
  return {
    title: video.title,
    description:
      video.description ??
      `${video.title}: a short ${video.examShortName ?? "UPSC and SSC"} prep video.`,
    alternates: { canonical: `/videos/${slug}` },
  };
}

export default async function VideoPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{2,90}$/.test(slug)) notFound();
  const video = await getVideoBySlug(slug);
  if (!video) notFound();
  const session = await getSession();
  const more = (await listVideos((video.examCode as ExamCode | null) ?? undefined, 7))
    .filter((item) => item.id !== video.id)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link href="/videos" className="text-pen text-sm font-semibold">
        All videos
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">{video.title}</h1>
      <p className="text-ink-muted mt-2">
        {video.examShortName ?? "All exams"}
        {video.topic ? ` · ${video.topic}` : ""}
      </p>
      <div className="mt-6">
        {session ? (
          <YouTubeEmbed id={video.youtubeId} title={video.title} />
        ) : (
          <div className="bg-night relative grid aspect-video place-items-center overflow-hidden rounded-[var(--radius-control)] text-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={youtubeThumbnail(video.youtubeId)}
              alt=""
              className="absolute inset-0 size-full scale-105 object-cover opacity-40 blur-sm"
            />
            <div className="relative px-6 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-white/15 backdrop-blur">
                <Lock aria-hidden="true" className="size-6" />
              </span>
              <p className="font-display mt-4 text-xl font-bold">Sign in to watch</p>
              <p className="mt-1 text-white/80">
                Free with an account. It takes less than a minute.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <ButtonLink href={`/sign-up?next=${encodeURIComponent(`/videos/${slug}`)}`}>
                  <PlayCircle aria-hidden="true" className="size-5" />
                  Create a free account
                </ButtonLink>
                <ButtonLink
                  href={`/sign-in?next=${encodeURIComponent(`/videos/${slug}`)}`}
                  variant="secondary"
                >
                  Sign in
                </ButtonLink>
              </div>
            </div>
          </div>
        )}
      </div>
      {video.description ? (
        <p className="mt-6 max-w-prose whitespace-pre-line">{video.description}</p>
      ) : null}

      <section className="border-line bg-surface panel mt-8 rounded-[var(--radius-panel)] border p-6">
        <h2 className="text-xl font-bold">Have a doubt about this topic?</h2>
        <p className="text-ink-muted mt-2">Ask a verified mentor in a one-to-one session.</p>
        <Link
          href={video.examCode ? `/mentors?exam=${video.examCode}` : "/mentors"}
          className="text-pen mt-3 inline-block font-semibold"
        >
          Find a mentor
        </Link>
      </section>

      {more.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold">More videos</h2>
          <ul className="mt-4 space-y-2">
            {more.map((item) => (
              <li key={item.id}>
                <Link href={`/videos/${item.slug}`} className="text-pen font-semibold">
                  {item.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
