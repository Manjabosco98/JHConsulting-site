import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { ContactStatus } from "@/lib/admin/labels";

type Client = Awaited<ReturnType<typeof createClient>>;
type CountResult = PromiseLike<{ count: number | null; error: { message: string } | null }>;

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

async function count(what: string, query: CountResult) {
  const { count, error } = await query;
  if (error) fail(what, error);
  return count ?? 0;
}

/**
 * Admin overview. Uses the caller's session client, so RLS (is_admin) still
 * applies: a non-admin client would only see public rows.
 */
export async function getDashboardData(supabase: Client): Promise<DashboardData> {
  const head = { count: "exact", head: true } as const;
  const [
    projectsTotal, projectsPublished, projectsArchived, projectsDrafts,
    servicesTotal, servicesActive, technologiesTotal, technologiesActive,
    contactsTotal, contactsNew, recentContacts, recentProjects, settings
  ] = await Promise.all([
    count("projects", supabase.from("projects").select("id", head)),
    count("projects published", supabase.from("projects").select("id", head).eq("published", true)),
    count("projects archived", supabase.from("projects").select("id", head).not("archived_at", "is", null)),
    count("projects drafts", supabase.from("projects").select("id", head).eq("published", false).is("archived_at", null)),
    count("services", supabase.from("services").select("id", head)),
    count("services active", supabase.from("services").select("id", head).eq("active", true)),
    count("technologies", supabase.from("technologies").select("id", head)),
    count("technologies active", supabase.from("technologies").select("id", head).eq("active", true)),
    count("contacts", supabase.from("contacts").select("id", head)),
    count("contacts new", supabase.from("contacts").select("id", head).eq("status", "NEW")),
    supabase.from("contacts").select("id, name, company, project_type, status, created_at")
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("projects").select("id, title, published, archived_at, updated_at")
      .order("updated_at", { ascending: false }).limit(5),
    supabase.from("site_settings").select("email, whatsapp, linkedin_url, github_url, profile_image").maybeSingle()
  ]);

  if (recentContacts.error) fail("recent contacts", recentContacts.error);
  if (recentProjects.error) fail("recent projects", recentProjects.error);
  if (settings.error) fail("settings", settings.error);

  const settingsRow = settings.data;
  const missingSettings = settingsRow
    ? (Object.keys(settingsFields) as (keyof typeof settingsFields)[])
        .filter((field) => !settingsRow[field])
        .map((field) => settingsFields[field])
    : null;

  return {
    projects: { total: projectsTotal, published: projectsPublished, drafts: projectsDrafts, archived: projectsArchived },
    services: { total: servicesTotal, active: servicesActive },
    technologies: { total: technologiesTotal, active: technologiesActive },
    contacts: { total: contactsTotal, new: contactsNew },
    recentContacts: recentContacts.data ?? [],
    recentProjects: recentProjects.data ?? [],
    missingSettings
  };
}
