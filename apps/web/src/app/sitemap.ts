import type { MetadataRoute } from "next";
import { legalLinks, siteConfig } from "@/config/site";
import { listPublishedSlugs } from "@/lib/mentor-directory";

// Built per request so `next build` never needs the database.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const mentors = await listPublishedSlugs().catch(() => []);
  return [
    { url: siteConfig.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteConfig.url}/mentors`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...mentors.map((mentor) => ({
      url: `${siteConfig.url}/mentors/${mentor.slug}`,
      lastModified: mentor.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...legalLinks.map((link) => ({
      url: `${siteConfig.url}${link.href}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
