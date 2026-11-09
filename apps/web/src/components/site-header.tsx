import Link from "next/link";
import { siteConfig } from "@/config/site";
import { HeaderAccount } from "@/components/header-account";
import { HeaderShell } from "@/components/header-shell";
import { MainNav, MobileMenu } from "@/components/main-nav";

export function SiteHeader() {
  return (
    <HeaderShell>
      <Link
        href="/"
        className="group flex items-center gap-2 rounded-md"
        aria-label={`${siteConfig.name} home`}
      >
        <span
          aria-hidden="true"
          className="from-saffron to-pen grid size-8 place-items-center rounded-full bg-gradient-to-br shadow-[var(--shadow-pen)] transition-transform duration-300 group-hover:rotate-[24deg] motion-reduce:transition-none"
        >
          <span className="grid size-5 place-items-center rounded-full bg-white">
            <span className="bg-ink size-2.5 rounded-full transition-transform duration-300 group-hover:scale-125" />
          </span>
        </span>
        <span className="font-display text-2xl leading-none font-extrabold tracking-tight">
          {siteConfig.name}
        </span>
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <MainNav />
        <HeaderAccount />
        <MobileMenu />
      </div>
    </HeaderShell>
  );
}
