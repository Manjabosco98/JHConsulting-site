import type { MetadataRoute } from "next";
import { siteConfig } from "@/constants/site";
import { listPublishedProjectSlugs } from "@/lib/repositories/public-projects";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const projects = await listPublishedProjectSlugs();
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projetos`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...projects.map(({ slug, updatedAt }) => ({
      url: `${base}/projetos/${slug}`,
      lastModified: new Date(updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
