import "server-only";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "./env";

/**
 * Only the new-format secret key is accepted. A publishable key pasted by
 * mistake then fails here with a clear message instead of failing later as an
 * opaque RLS error. Legacy service_role JWTs are rejected on purpose: the
 * project uses the current key format (see SPEC/03-CONFIGURACAO.md).
 */
const secretKeySchema = z
  .string()
  .trim()
  .regex(/^sb_secret_[A-Za-z0-9_-]+$/);

/** Whether the server can write contacts, without touching the value itself. */
export function hasSupabaseSecretKey() {
  return secretKeySchema.safeParse(process.env.SUPABASE_SECRET_KEY).success;
}

/**
 * Privileged, server-only client. It bypasses RLS, so it must be used **only**
 * where an unauthenticated visitor legitimately writes: today, storing a lead
 * from the public contact form. Column-level grants on public.contacts are what
 * keep it narrow — it can insert the form columns and read back nothing but the
 * id. Never import this from a Client Component and never expose the key with a
 * NEXT_PUBLIC_ prefix.
 */
export function createSecretClient() {
  const { url } = getSupabasePublicConfig();
  const secretKey = secretKeySchema.safeParse(process.env.SUPABASE_SECRET_KEY);
  if (!secretKey.success) {
    // Name the variable, never the value.
    throw new Error("Configuração ausente ou inválida: SUPABASE_SECRET_KEY.");
  }

  return createClient<Database>(url, secretKey.data, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "jhconsulting-server" } }
  });
}
