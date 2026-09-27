import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { TechnologyGroupInput, TechnologyInput } from "@/lib/validation/technology";

type Client = Awaited<ReturnType<typeof createClient>>;

export type AdminTechnology = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  display_order: number;
  /** How many projects and groups reference it — deletion is blocked by projects. */
  projects: number;
  groups: number;
};

export type AdminTechnologyGroup = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  display_order: number;
  members: number;
  updated_at: string;
};

export type AdminTechnologyGroupDetail = Omit<AdminTechnologyGroup, "members"> & { technology_ids: string[] };

type SaveFailure = "slug_taken" | "not_found" | "invalid_technology" | "forbidden" | "unknown";
export type SaveResult = { ok: true; id: string } | { ok: false; reason: SaveFailure };
export type DeleteTechnologyResult = { ok: true } | { ok: false; reason: "in_use" | "not_found" | "forbidden" | "unknown" };

const saveFailures: Record<string, SaveFailure> = {
  "23505": "slug_taken",
  P0002: "not_found",
  "23503": "invalid_technology",
  "42501": "forbidden"
};

function fail(what: string, error: { message: string }): never {
  console.error(`[technologies] ${what}: ${error.message}`);
  throw new Error("Não foi possível carregar as tecnologias.");
}

export async function listAdminTechnologies(supabase: Client): Promise<AdminTechnology[]> {
  const { data, error } = await supabase
    .from("technologies")
    .select("id, name, slug, active, display_order, project_technologies(count), technology_group_members(count)")
    .order("display_order")
    .order("name");
  if (error) fail("list", error);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    active: row.active,
    display_order: row.display_order,
    projects: row.project_technologies[0]?.count ?? 0,
    groups: row.technology_group_members[0]?.count ?? 0
  }));
}

export async function getAdminTechnology(supabase: Client, id: string): Promise<AdminTechnology | null> {
  const { data, error } = await supabase
    .from("technologies")
    .select("id, name, slug, active, display_order, project_technologies(count), technology_group_members(count)")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("get", error);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    active: data.active,
    display_order: data.display_order,
    projects: data.project_technologies[0]?.count ?? 0,
    groups: data.technology_group_members[0]?.count ?? 0
  };
}

export async function saveTechnology(supabase: Client, id: string | null, input: TechnologyInput): Promise<SaveResult> {
  const query = id
    ? supabase.from("technologies").update(input).eq("id", id).select("id")
    : supabase.from("technologies").insert(input).select("id");
  const { data, error } = await query;
  if (!error && data?.length) return { ok: true, id: data[0].id };
  if (!error) return { ok: false, reason: "not_found" };
  const reason = saveFailures[error.code] ?? "unknown";
  if (reason === "unknown") console.error(`[technologies] save: ${error.code} ${error.message}`);
  return { ok: false, reason };
}

/** Removes group links then the technology; blocked when a project uses it. */
export async function deleteTechnology(supabase: Client, id: string): Promise<DeleteTechnologyResult> {
  const { error } = await supabase.rpc("admin_delete_technology", { p_id: id });
  if (!error) return { ok: true };
  const reasons = { "23503": "in_use", P0002: "not_found", "42501": "forbidden" } as const;
  const reason = reasons[error.code as keyof typeof reasons];
  if (!reason) console.error(`[technologies] delete: ${error.code} ${error.message}`);
  return { ok: false, reason: reason ?? "unknown" };
}

export async function listAdminTechnologyGroups(supabase: Client): Promise<AdminTechnologyGroup[]> {
  const { data, error } = await supabase
    .from("technology_groups")
    .select("id, name, slug, active, display_order, updated_at, technology_group_members(count)")
    .order("display_order")
    .order("name");
  if (error) fail("list groups", error);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    active: row.active,
    display_order: row.display_order,
    updated_at: row.updated_at,
    members: row.technology_group_members[0]?.count ?? 0
  }));
}

export async function getAdminTechnologyGroup(supabase: Client, id: string): Promise<AdminTechnologyGroupDetail | null> {
  const { data, error } = await supabase
    .from("technology_groups")
    .select("id, name, slug, active, display_order, updated_at, technology_group_members(technology_id, display_order)")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("get group", error);
  if (!data) return null;
  const { technology_group_members: members, ...group } = data;
  return {
    ...group,
    technology_ids: [...members].sort((a, b) => a.display_order - b.display_order).map((member) => member.technology_id)
  };
}

/** Creates (id = null) or updates a group and replaces its members in one transaction. */
export async function saveTechnologyGroup(supabase: Client, id: string | null, input: TechnologyGroupInput): Promise<SaveResult> {
  const { technology_ids, ...group } = input;
  const { data, error } = await supabase.rpc("admin_save_technology_group", {
    p_group: group,
    p_technology_ids: technology_ids,
    ...(id ? { p_id: id } : {})
  });
  if (!error && data) return { ok: true, id: data };
  const reason = error?.code ? saveFailures[error.code] : undefined;
  if (!reason) console.error(`[technologies] save group: ${error?.code} ${error?.message}`);
  return { ok: false, reason: reason ?? "unknown" };
}

export async function deleteTechnologyGroup(supabase: Client, id: string): Promise<{ ok: boolean }> {
  // Members cascade with the group.
  const { data, error } = await supabase.from("technology_groups").delete().eq("id", id).select("id");
  if (error) {
    console.error(`[technologies] delete group: ${error.code} ${error.message}`);
    return { ok: false };
  }
  return { ok: (data ?? []).length === 1 };
}
