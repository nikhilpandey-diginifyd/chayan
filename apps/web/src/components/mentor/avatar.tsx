import Image from "next/image";
import { cn } from "@/lib/utils";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  url,
  size = 64,
  className,
}: {
  name: string;
  url: string | null;
  size?: number;
  className?: string;
}) {
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        unoptimized
        className={cn("border-line shrink-0 rounded-full border object-cover", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "border-omr bg-surface font-display text-ink grid shrink-0 place-items-center rounded-full border-2 font-bold",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials(name)}
    </span>
  );
}
