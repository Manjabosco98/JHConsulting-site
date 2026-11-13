import type { MetadataRoute } from "next";
import { siteConfig } from "@/constants/site";
import { getSiteSettings } from "@/lib/repositories/public-settings";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const updatedAt = settings.updatedAt ? Date.parse(settings.updatedAt) : Number.NaN;
  return [{
    url: siteConfig.url.replace(/\/$/, ""),
    ...(Number.isFinite(updatedAt) ? { lastModified: new Date(updatedAt) } : {}),
    changeFrequency: "monthly",
    priority: 1
  }];
}
