import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "./env";

/**
 * Anonymous, cookie-free client for public pages. No session is read or stored,
 * so pages that use it stay cacheable (ISR); RLS grants anon read-only access to
 * published content. Never use this where an authenticated action is required.
 */
export function createPublicClient() {
  const { url, publishableKey } = getSupabasePublicConfig();
  return createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
