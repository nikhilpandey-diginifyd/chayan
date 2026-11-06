import type { MetadataRoute } from "next";
import { legalLinks, siteConfig } from "@/config/site";
import { listPapers, listVideos } from "@/lib/content";
import { listPublishedSlugs } from "@/lib/mentor-directory";

// Built per request so `next build` never needs the database.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [mentors, papers, videos] = await Promise.all([
    listPublishedSlugs().catch(() => []),
    listPapers({}, 5000).catch(() => []),
    listVideos(undefined, 5000).catch(() => []),
  ]);
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
    {
      url: `${siteConfig.url}/papers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...papers.map((paper) => ({
      url: `${siteConfig.url}/papers/${paper.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteConfig.url}/videos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...videos.map((video) => ({
      url: `${siteConfig.url}/videos/${video.slug}`,
      lastModified: video.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...legalLinks.map((link) => ({
      url: `${siteConfig.url}${link.href}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];
}
