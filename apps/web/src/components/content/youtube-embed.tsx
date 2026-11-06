/**
 * Privacy-enhanced YouTube player (youtube-nocookie.com): no tracking cookies
 * until the viewer presses play.
 */
export function YouTubeEmbed({ id, title }: { id: string; title: string }) {
  return (
    <div className="bg-ink relative aspect-video overflow-hidden rounded-[var(--radius-control)]">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1`}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
        className="absolute inset-0 size-full"
      />
    </div>
  );
}

export function youtubeThumbnail(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
