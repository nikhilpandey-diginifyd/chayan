import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
      <p className="text-ink-muted mt-3">Last updated: {siteConfig.policyLastUpdated}</p>
      <div className="prose-legal mt-8">{children}</div>
    </div>
  );
}
