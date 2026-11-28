import Link from "next/link";
import { siteConfig } from "@/config/site";
import { BrandLogo } from "@/components/brand-logo";
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
        <BrandLogo size={32} textClassName="text-2xl" />
      </Link>
      <div className="flex items-center gap-1 sm:gap-2">
        <MainNav />
        <HeaderAccount />
        <MobileMenu />
      </div>
    </HeaderShell>
  );
}
