import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { countContactsByStatus, type ContactCounts } from "@/lib/repositories/contacts";
import type { ContactStatus } from "@/lib/admin/labels";

type Client = Awaited<ReturnType<typeof createClient>>;

export type DashboardService = { id: string; title: string; active: boolean; updated_at: string };
export type DashboardData = {
  services: { total: number; active: number };
  contacts: ContactCounts;
  recentContacts: { id: string; name: string; company: string; project_type: string; status: ContactStatus; created_at: string }[];
  recentServices: DashboardService[];
  missingSettings: string[] | null;
};

const settingsFields = { email: "E-mail", whatsapp: "WhatsApp" } as const;

function fail(what: string, error: { message: string }): never {
  console.error(`[dashboard] ${what}: ${error.message}`);
  throw new Error("Não foi possível carregar o painel.");
}

/** Session-scoped queries. Portfolio data is never loaded by the overview. */
export async function getDashboardData(supabase: Client): Promise<DashboardData> {
  const [services, contacts, recentContacts, settings] = await Promise.all([
    supabase.from("services").select("id, title, active, updated_at")
      .order("display_order").order("created_at", { ascending: false }),
    countContactsByStatus(supabase),
    supabase.from("contacts").select("id, name, company, project_type, status, created_at")
      .not("status", "in", "(CONVERTED,ARCHIVED)")
      .order("created_at", { ascending: false }).limit(5),
    supabase.from("site_settings").select("email, whatsapp").maybeSingle()
  ]);
  if (services.error) fail("services", services.error);
  if (recentContacts.error) fail("recent contacts", recentContacts.error);
  if (settings.error) fail("settings", settings.error);

  const serviceRows = services.data ?? [];
  const settingsRow = settings.data;
  return {
    services: { total: serviceRows.length, active: serviceRows.filter((row) => row.active).length },
    contacts,
    recentContacts: recentContacts.data ?? [],
    recentServices: serviceRows.slice(0, 4),
    missingSettings: settingsRow
      ? (Object.keys(settingsFields) as (keyof typeof settingsFields)[])
          .filter((field) => !settingsRow[field]).map((field) => settingsFields[field])
      : null
  };
}
