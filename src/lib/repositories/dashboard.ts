import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { ContactStatus } from "@/lib/admin/labels";

type Client = Awaited<ReturnType<typeof createClient>>;
type RowsResult<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export type DashboardData = {
  projects: { total: number; published: number; drafts: number; archived: number };
  services: { total: number; active: number };
  technologies: { total: number; active: number };
  contacts: { total: number; new: number };
  recentContacts: { id: string; name: string; company: string; project_type: string; status: ContactStatus; created_at: string }[];
  recentProjects: { id: string; title: string; published: boolean; archived_at: string | null; updated_at: string }[];
  /** Public contact fields still empty in site_settings (labels), or null when the row is missing. */
  missingSettings: string[] | null;
};

const settingsFields = {
  email: "E-mail",
  whatsapp: "WhatsApp",
  linkedin_url: "LinkedIn",
  github_url: "GitHub",
  profile_image: "Foto profissional"
} as const;

function fail(what: string, error: { message: string }): never {
  // Keep database details in server logs only.
  console.error(`[dashboard] ${what}: ${error.message}`);
  throw new Error("Não foi possível carregar o dashboard.");
}

async function rows<T>(what: string, query: RowsResult<T>): Promise<T[]> {
  const { data, error } = await query;
  if (error) fail(what, error);
  return data ?? [];
}

/**
 * Admin overview. Uses the caller's session client, so RLS (is_admin) still
 * applies: a non-admin client would only see public rows.
 *
 * Counters are aggregated in JS from one narrow query per table instead of one
 * `head` count per bucket: 7 requests instead of 13, and the buckets keep the
 * exact filters they had as separate counts.
 */
export async function getDashboardData(supabase: Client): Promise<DashboardData> {
  const [projectRows, serviceRows, technologyRows, contactRows, recentContacts, recentProjects, settings] =
    await Promise.all([
      rows("projects", supabase.from("projects").select("published, archived_at")),
      rows("services", supabase.from("services").select("active")),
      rows("technologies", supabase.from("technologies").select("active")),
      rows("contacts", supabase.from("contacts").select("status")),
      supabase.from("contacts").select("id, name, company, project_type, status, created_at")
        .order("created_at", { ascending: false }).limit(5),
      supabase.from("projects").select("id, title, published, archived_at, updated_at")
        .order("updated_at", { ascending: false }).limit(5),
      supabase.from("site_settings").select("email, whatsapp, linkedin_url, github_url, profile_image").maybeSingle()
    ]);

  if (recentContacts.error) fail("recent contacts", recentContacts.error);
  if (recentProjects.error) fail("recent projects", recentProjects.error);
  if (settings.error) fail("settings", settings.error);

  // Buckets are independent, exactly as the per-bucket counts were: a project
  // that is both published and archived lands in both, and only true drafts
  // (neither) land in `drafts`.
  const projects = { total: projectRows.length, published: 0, drafts: 0, archived: 0 };
  for (const row of projectRows) {
    if (row.published) projects.published += 1;
    if (row.archived_at) projects.archived += 1;
    if (!row.published && !row.archived_at) projects.drafts += 1;
  }

  const services = {
    total: serviceRows.length,
    active: serviceRows.filter((service) => service.active).length
  };
  const technologies = {
    total: technologyRows.length,
    active: technologyRows.filter((technology) => technology.active).length
  };
  const contacts = {
    total: contactRows.length,
    new: contactRows.filter((contact) => contact.status === "NEW").length
  };

  const settingsRow = settings.data;
  const missingSettings = settingsRow
    ? (Object.keys(settingsFields) as (keyof typeof settingsFields)[])
        .filter((field) => !settingsRow[field])
        .map((field) => settingsFields[field])
    : null;

  return {
    projects,
    services,
    technologies,
    contacts,
    recentContacts: recentContacts.data ?? [],
    recentProjects: recentProjects.data ?? [],
    missingSettings
  };
}
