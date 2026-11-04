import Link from "next/link";
import { siteConfig } from "@/config/site";
import { HeaderAccount } from "@/components/header-account";

export function SiteHeader() {
  return (
    <header className="border-line bg-surface border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label={`${siteConfig.name} home`}>
          <span
            aria-hidden="true"
            className="border-omr grid size-7 place-items-center rounded-full border-2"
          >
            <span className="bg-ink size-3.5 rounded-full" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/mentors"
            className="text-ink hover:text-pen rounded-md px-3 py-2 font-semibold"
          >
            Find a mentor
          </Link>
          <Link
            href="/#pricing"
            className="text-ink-muted hover:text-ink hidden rounded-md px-3 py-2 sm:block"
          >
            Pricing
          </Link>
          <HeaderAccount />
        </nav>
      </div>
    </header>
  );
}
