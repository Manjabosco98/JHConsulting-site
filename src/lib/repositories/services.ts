import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { ServiceInput } from "@/lib/validation/service";

type Client = Awaited<ReturnType<typeof createClient>>;

export type AdminService = {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  tech: string;
  display_order: number;
  active: boolean;
  updated_at: string;
};

type SaveFailure = "slug_taken" | "not_found" | "forbidden" | "unknown";
export type SaveServiceResult = { ok: true; id: string } | { ok: false; reason: SaveFailure };

const saveFailures: Record<string, SaveFailure> = {
  "23505": "slug_taken",
  "42501": "forbidden"
};

function fail(what: string, error: { message: string }): never {
  console.error(`[services] ${what}: ${error.message}`);
  throw new Error("Não foi possível carregar os serviços.");
}

export async function listAdminServices(supabase: Client): Promise<AdminService[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, title, slug, description, icon, tech, display_order, active, updated_at")
    .order("display_order")
    .order("created_at", { ascending: false });
  if (error) fail("list", error);
  return data ?? [];
}

export async function getAdminService(supabase: Client, id: string): Promise<AdminService | null> {
  const { data, error } = await supabase
    .from("services")
    .select("id, title, slug, description, icon, tech, display_order, active, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("get", error);
  return data;
}

export async function saveService(supabase: Client, id: string | null, input: ServiceInput): Promise<SaveServiceResult> {
  const query = id
    ? supabase.from("services").update(input).eq("id", id).select("id")
    : supabase.from("services").insert(input).select("id");
  const { data, error } = await query;

  if (!error && data?.length) return { ok: true, id: data[0].id };
  if (!error) return { ok: false, reason: "not_found" }; // update matched no row
  const reason = saveFailures[error.code] ?? "unknown";
  if (reason === "unknown") console.error(`[services] save: ${error.code} ${error.message}`);
  return { ok: false, reason };
}

export async function deleteService(supabase: Client, id: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.from("services").delete().eq("id", id).select("id");
  if (error) {
    console.error(`[services] delete: ${error.code} ${error.message}`);
    return { ok: false };
  }
  return { ok: (data ?? []).length === 1 };
}
