import type { ReactNode } from "react";
import { ScrollText } from "lucide-react";
import { LegalToc } from "@/components/legal-toc";
import { PageHero } from "@/components/page/page-hero";
import { siteConfig } from "@/config/site";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <PageHero
        icon={<ScrollText aria-hidden="true" className="size-4" />}
        eyebrow={`Last updated: ${siteConfig.policyLastUpdated}`}
        title={title}
        description="Plain language, no fine print tricks. Write to us if anything is unclear."
      />
      <div className="relative mx-auto -mt-10 grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_16rem]">
        <div className="panel border-line rounded-[var(--radius-panel)] border bg-white p-6 shadow-[var(--shadow-raised)] sm:p-10">
          <div className="prose-legal">{children}</div>
        </div>
        <aside>
          <LegalToc />
        </aside>
      </div>
    </>
  );
}
