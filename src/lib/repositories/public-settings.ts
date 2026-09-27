import "server-only";

import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { publicImageUrl } from "@/lib/storage/images";
import { siteConfig } from "@/constants/site";

export type SiteSettings = {
  companyName: string;
  professionalName: string;
  role: string;
  description: string;
  /** Paragraphs of the About text. */
  bio: string[];
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  instagramUrl: string | null;
  location: string;
  serviceArea: string;
  profileImageUrl: string | null;
};

/** Placeholders from the old env-based config are treated as "not set". */
const placeholders = new Set(["[EMAIL]", "[WHATSAPP]", "[LINKEDIN]", "[GITHUB]", "[INSTAGRAM]"]);
function optional(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return !trimmed || placeholders.has(trimmed) ? null : trimmed;
}

function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
}

/** Values bundled in the code, used until settings exist and if the query fails. */
function fallbackSettings(): SiteSettings {
  return {
    companyName: siteConfig.name,
    professionalName: siteConfig.professional,
    role: siteConfig.role,
    description: siteConfig.description,
    bio: [],
    email: optional(siteConfig.email),
    phone: null,
    whatsapp: optional(siteConfig.whatsapp),
    linkedinUrl: optional(siteConfig.linkedin),
    githubUrl: optional(siteConfig.github),
    instagramUrl: optional(siteConfig.instagram),
    location: siteConfig.location,
    serviceArea: siteConfig.serviceArea,
    profileImageUrl: null
  };
}

/**
 * Institutional settings for the public site. Deduplicated per request, so every
 * section can call it. Never throws: falls back to the bundled constants, which
 * keeps the site rendering if the row is missing or the query fails.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select("company_name, professional_name, role, description, bio, email, phone, whatsapp, linkedin_url, github_url, instagram_url, location, service_area, profile_image")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return fallbackSettings();

    return {
      companyName: data.company_name,
      professionalName: data.professional_name,
      role: data.role,
      description: data.description,
      bio: paragraphs(data.bio),
      email: optional(data.email),
      phone: optional(data.phone),
      whatsapp: optional(data.whatsapp),
      linkedinUrl: optional(data.linkedin_url),
      githubUrl: optional(data.github_url),
      instagramUrl: optional(data.instagram_url),
      location: data.location,
      serviceArea: data.service_area,
      profileImageUrl: publicImageUrl(data.profile_image)
    };
  } catch (error) {
    console.error(`[settings] fell back to constants: ${(error as Error).message}`);
    return fallbackSettings();
  }
});
