import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clapperboard, PlayCircle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { EXAM_CODES, EXAMS, type ExamCode } from "@chayan/shared";
import { youtubeThumbnail } from "@/components/content/youtube-embed";
import { listVideos } from "@/lib/content";
import { getSession } from "@/lib/session";
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
  const [videos, session] = await Promise.all([listVideos(exam), getSession()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Short prep videos</h1>
      <p className="text-ink-muted mt-3 max-w-prose">
        Two to five minute lessons from people who cleared the exam.{" "}
        {session ? "Free to watch." : "Free to watch with an account."}
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
        <div className="mt-10">
          <EmptyState icon={Clapperboard} title="No videos here yet.">
            New lessons are added every week.
          </EmptyState>
        </div>
      ) : (
        <ul className="stagger mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, index) => (
            <li
              key={video.id}
              style={{ "--i": index } as React.CSSProperties}
              className="card-link group border-line bg-surface relative overflow-hidden rounded-[var(--radius-panel)] border"
            >
              <div className="bg-ink relative aspect-video">
                <Image
                  src={youtubeThumbnail(video.youtubeId)}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:scale-105 motion-reduce:transition-none"
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                />
                <PlayCircle
                  aria-hidden="true"
                  className="absolute top-1/2 left-1/2 size-14 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none"
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
