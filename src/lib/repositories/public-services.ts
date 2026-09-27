import "server-only";

import { createPublicClient } from "@/lib/supabase/public";

export type PublicService = {
  id: string;
  title: string;
  description: string;
  /** Lucide icon name; resolve with resolveServiceIcon before rendering. */
  icon: string;
  tech: string;
};

/** Active services in display order. RLS already hides inactive ones from anon. */
export async function listActiveServices(): Promise<PublicService[]> {
  const { data, error } = await createPublicClient()
    .from("services")
    .select("id, title, description, icon, tech")
    .order("display_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`listActiveServices: ${error.message}`);
  return data ?? [];
}
