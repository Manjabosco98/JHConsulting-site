import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { ProjectInput, ProjectVisibility } from "@/lib/validation/project";

type Client = Awaited<ReturnType<typeof createClient>>;

export const projectFilters = ["todos", "publicados", "rascunhos", "arquivados"] as const;
export type ProjectFilter = (typeof projectFilters)[number];

export type AdminProjectRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: string;
  visibility: ProjectVisibility;
  featured: boolean;
  display_order: number;
  technologies: number;
  updated_at: string;
};

export type AdminProject = Omit<AdminProjectRow, "technologies"> & {
  short_description: string;
  description: string;
  problem: string;
  solution: string;
  repository_url: string | null;
  demo_url: string | null;
  cover_image: string | null;
  published_at: string | null;
  technology_ids: string[];
};

export type TechnologyOption = { id: string; name: string; active: boolean };

function fail(what: string, error: { message: string }): never {
  console.error(`[projects] ${what}: ${error.message}`);
  throw new Error("Não foi possível carregar os projetos.");
}

export function visibilityOf(project: { published: boolean; archived_at: string | null }): ProjectVisibility {
  if (project.archived_at) return "archived";
  return project.published ? "published" : "draft";
}

/** Escapes LIKE wildcards so the search is literal. */
function likePattern(search: string) {
  return `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export async function listAdminProjects(supabase: Client, { filter, search }: { filter: ProjectFilter; search: string }) {
  let query = supabase
    .from("projects")
    .select("id, title, slug, category, status, published, archived_at, featured, display_order, updated_at, project_technologies(count)")
    .order("display_order")
    .order("created_at", { ascending: false });

  if (filter === "publicados") query = query.eq("published", true);
  if (filter === "rascunhos") query = query.eq("published", false).is("archived_at", null);
  if (filter === "arquivados") query = query.not("archived_at", "is", null);
  if (search) query = query.ilike("title", likePattern(search));

  const { data, error } = await query;
  if (error) fail("list", error);
  return (data ?? []).map((row): AdminProjectRow => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    status: row.status,
    visibility: visibilityOf(row),
    featured: row.featured,
    display_order: row.display_order,
    technologies: row.project_technologies[0]?.count ?? 0,
    updated_at: row.updated_at
  }));
}

export async function countProjectsByFilter(supabase: Client): Promise<Record<ProjectFilter, number>> {
  const { data, error } = await supabase.from("projects").select("published, archived_at");
  if (error) fail("counts", error);
  const counts: Record<ProjectFilter, number> = { todos: 0, publicados: 0, rascunhos: 0, arquivados: 0 };
  for (const row of data ?? []) {
    counts.todos += 1;
    const visibility = visibilityOf(row);
    counts[visibility === "published" ? "publicados" : visibility === "draft" ? "rascunhos" : "arquivados"] += 1;
  }
  return counts;
}

export async function getAdminProject(supabase: Client, id: string): Promise<AdminProject | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, title, slug, category, status, short_description, description, problem, solution, repository_url, demo_url, cover_image, featured, display_order, published, published_at, archived_at, updated_at, project_technologies(technology_id, display_order)")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("get", error);
  if (!data) return null;
  const { project_technologies: links, published, archived_at, ...project } = data;
  return {
    ...project,
    visibility: visibilityOf({ published, archived_at }),
    technology_ids: [...links].sort((a, b) => a.display_order - b.display_order).map((link) => link.technology_id)
  };
}

export async function listTechnologyOptions(supabase: Client): Promise<TechnologyOption[]> {
  const { data, error } = await supabase.from("technologies").select("id, name, active").order("name");
  if (error) fail("technology options", error);
  return data ?? [];
}

/** Distinct categories and editorial labels already in use, for form suggestions. */
export async function listProjectSuggestions(supabase: Client) {
  const { data, error } = await supabase.from("projects").select("category, status");
  if (error) fail("suggestions", error);
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  return {
    categories: unique((data ?? []).map((row) => row.category)),
    labels: unique((data ?? []).map((row) => row.status))
  };
}

type SaveFailure = "slug_taken" | "not_found" | "invalid_technology" | "forbidden" | "unknown";
export type SaveProjectResult = { ok: true; id: string } | { ok: false; reason: SaveFailure };

// Postgres error codes raised by admin_save_project / table constraints.
const saveFailures: Record<string, SaveFailure> = {
  "23505": "slug_taken",
  P0002: "not_found",
  "23503": "invalid_technology",
  "42501": "forbidden"
};

/** Creates (id = null) or updates a project and its technologies in one transaction (RPC). */
export async function saveProject(supabase: Client, id: string | null, input: ProjectInput): Promise<SaveProjectResult> {
  const { technology_ids, ...project } = input;
  const { data, error } = await supabase.rpc("admin_save_project", {
    p_project: project,
    p_technology_ids: technology_ids,
    ...(id ? { p_id: id } : {})
  });
  if (!error && data) return { ok: true, id: data };

  const reason = error?.code ? saveFailures[error.code] : undefined;
  if (!reason) console.error(`[projects] save: ${error?.code} ${error?.message}`);
  return { ok: false, reason: reason ?? "unknown" };
}

export async function deleteProject(supabase: Client, id: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.from("projects").delete().eq("id", id).select("id");
  if (error) {
    console.error(`[projects] delete: ${error.code} ${error.message}`);
    return { ok: false };
  }
  return { ok: (data ?? []).length === 1 };
}
