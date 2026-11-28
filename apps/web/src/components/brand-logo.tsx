import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo mark plus the "prepanyexam" wordmark (Baloo 2 ExtraBold, "any" in brand orange).
 * Use tone="dark" on dark backgrounds: white text, brighter orange, and the dark mark.
 */
export function BrandLogo({
  size = 32,
  tone = "light",
  className,
  textClassName,
}: {
  size?: number;
  tone?: "light" | "dark";
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={tone === "dark" ? "/logo-mark-dark.svg" : "/logo-mark.svg"}
        alt=""
        width={size}
        height={size}
        unoptimized
      />
      <span
        className={cn(
          "font-display leading-none font-extrabold tracking-tight",
          tone === "dark" ? "text-white" : "text-ink",
          textClassName,
        )}
      >
        prep<span className={tone === "dark" ? "text-saffron" : "text-any"}>any</span>exam
      </span>
    </span>
  );
}
