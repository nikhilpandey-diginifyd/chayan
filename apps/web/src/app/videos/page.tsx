import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PlayCircle } from "lucide-react";
import { EXAM_CODES, EXAMS, type ExamCode } from "@chayan/shared";
import { youtubeThumbnail } from "@/components/content/youtube-embed";
import { listVideos } from "@/lib/content";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Short UPSC and SSC prep videos",
  description: "Two to five minute lessons on UPSC and SSC topics that come up again and again.",
  alternates: { canonical: "/videos" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function VideosPage({ searchParams }: Props) {
  const params = await searchParams;
  const exam =
    typeof params.exam === "string" && (EXAM_CODES as readonly string[]).includes(params.exam)
      ? (params.exam as ExamCode)
      : undefined;
  const videos = await listVideos(exam);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">Short prep videos</h1>
      <p className="text-ink-muted mt-3 max-w-prose">
        Two to five minute lessons from people who cleared the exam. Free to watch.
      </p>
      <nav aria-label="Filter by exam" className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/videos"
          aria-current={!exam ? "page" : undefined}
          className={cn(
            "rounded-full border px-4 py-1.5 text-sm font-semibold",
            !exam
              ? "border-pen bg-pen text-white"
              : "border-line bg-surface text-ink-muted hover:text-ink",
          )}
        >
          All
        </Link>
        {EXAMS.map((item) => (
          <Link
            key={item.code}
            href={`/videos?exam=${item.code}`}
            aria-current={exam === item.code ? "page" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold",
              exam === item.code
                ? "border-pen bg-pen text-white"
                : "border-line bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {item.shortName}
          </Link>
        ))}
      </nav>

      {videos.length === 0 ? (
        <p className="text-ink-muted mt-10">
          No videos here yet. New lessons are added every week.
        </p>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video) => (
            <li
              key={video.id}
              className="border-line bg-surface hover:border-ink-muted relative overflow-hidden rounded-[var(--radius-panel)] border"
            >
              <div className="bg-ink relative aspect-video">
                <Image
                  src={youtubeThumbnail(video.youtubeId)}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <PlayCircle
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 size-12 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow"
                />
              </div>
              <div className="p-4">
                <h2 className="font-bold">
                  <Link href={`/videos/${video.slug}`} className="after:absolute after:inset-0">
                    {video.title}
                  </Link>
                </h2>
                <p className="text-ink-muted mt-1 text-sm">
                  {video.examShortName ?? "All exams"}
                  {video.topic ? ` · ${video.topic}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
