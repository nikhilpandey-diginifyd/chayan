import Link from "next/link";
import { legalLinks, siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-line bg-surface mt-24 border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-extrabold">{siteConfig.name}</p>
          <p className="text-ink-muted mt-2 max-w-sm">{siteConfig.description}</p>
        </div>
        <div>
          <p className="font-semibold">Explore</p>
          <ul className="mt-3 space-y-2">
            {[
              { href: "/mentors", label: "Find a mentor" },
              { href: "/papers", label: "Previous year papers" },
              { href: "/videos", label: "Prep videos" },
              { href: "/#pricing", label: "Pricing" },
              { href: "/mentor/apply", label: "Become a mentor" },
            ].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink-muted hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Policies</p>
          <ul className="mt-3 space-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-ink-muted hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Support</p>
          <ul className="text-ink-muted mt-3 space-y-2">
            <li>
              <a href={`mailto:${siteConfig.business.email}`} className="hover:text-ink">
                {siteConfig.business.email}
              </a>
            </li>
            <li>{siteConfig.business.phone}</li>
            <li>{siteConfig.business.supportHours}</li>
          </ul>
        </div>
      </div>
      <div className="border-line border-t">
        <p className="text-ink-muted mx-auto max-w-6xl px-4 py-5 text-sm sm:px-6">
          © {new Date().getFullYear()} {siteConfig.business.legalName}. Not affiliated with UPSC,
          SSC or any government body.
        </p>
      </div>
    </footer>
  );
}
