import type { MetadataRoute } from "next";
import { siteConfig } from "@/constants/site";
import { listPublishedProjectSlugs } from "@/lib/repositories/public-projects";
import { getSiteSettings } from "@/lib/repositories/public-settings";

export const revalidate = 3600;

/** Newest valid timestamp, or now when there is nothing to go by. */
function newest(values: (string | null)[]): Date {
  const times = values
    .map((value) => (value ? Date.parse(value) : Number.NaN))
    .filter((time) => Number.isFinite(time));
  return times.length ? new Date(Math.max(...times)) : new Date();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url.replace(/\/$/, "");
  const [projects, settings] = await Promise.all([listPublishedProjectSlugs(), getSiteSettings()]);

  const projectTimes = projects.map((project) => project.updatedAt);
  // lastModified reports real content changes instead of the render time, which
  // would tell crawlers every page changed on every revalidation.
  const home = newest([settings.updatedAt, ...projectTimes]);
  const listing = newest(projectTimes);

  return [
    { url: base, lastModified: home, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/projetos`, lastModified: listing, changeFrequency: "weekly", priority: 0.8 },
    ...projects.map(({ slug, updatedAt }) => ({
      url: `${base}/projetos/${slug}`,
      lastModified: newest([updatedAt]),
      changeFrequency: "monthly" as const,
      priority: 0.7
    }))
  ];
}
