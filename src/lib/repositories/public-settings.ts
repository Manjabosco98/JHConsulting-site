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

function optional(value: string | null | undefined): string | null {
  const trimmed = (value ?? "").trim();
  return trimmed || null;
}

function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
}

/**
 * Degraded mode: the page still renders, but with no institutional data at all
 * instead of a stale copy bundled at build time. Only the brand name survives,
 * because it is also the wordmark in the markup.
 *
 * In practice this is unreachable: the row is a singleton that the seed created
 * and that no role can delete (see the RLS matrix). It exists for a query that
 * fails on a cold render — and even then ISR keeps serving the last good page.
 */
function degradedSettings(): SiteSettings {
  return {
    companyName: siteConfig.name,
    professionalName: "",
    role: "",
    description: "",
    bio: [],
    email: null,
    phone: null,
    whatsapp: null,
    linkedinUrl: null,
    githubUrl: null,
    instagramUrl: null,
    location: "",
    serviceArea: "",
    profileImageUrl: null
  };
}

/**
 * Institutional settings for the public site, from /admin/configuracoes.
 * Deduplicated per request, so every section can call it. Never throws: a
 * failure degrades the section instead of breaking the whole page.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const { data, error } = await createPublicClient()
      .from("site_settings")
      .select("company_name, professional_name, role, description, bio, email, phone, whatsapp, linkedin_url, github_url, instagram_url, location, service_area, profile_image")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      console.error("[settings] linha única de site_settings ausente.");
      return degradedSettings();
    }

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
    console.error(`[settings] consulta falhou, seguindo em modo degradado: ${(error as Error).message}`);
    return degradedSettings();
  }
});
