import Link from "next/link";
import { siteConfig } from "@/config/site";
import { HeaderAccount } from "@/components/header-account";
import { MainNav, MobileMenu } from "@/components/main-nav";

export function SiteHeader() {
  return (
    <header className="border-line/70 sticky top-0 z-40 border-b bg-white/75 backdrop-blur-xl backdrop-saturate-150 supports-[not(backdrop-filter:blur(1px))]:bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-md"
          aria-label={`${siteConfig.name} home`}
        >
          <span
            aria-hidden="true"
            className="border-omr grid size-7 place-items-center rounded-full border-2 transition-transform duration-300 group-hover:rotate-[20deg] motion-reduce:transition-none"
          >
            <span className="bg-ink size-3.5 rounded-full transition-transform duration-300 group-hover:scale-110" />
          </span>
          <span className="font-display text-xl font-extrabold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          <MainNav />
          <HeaderAccount />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
