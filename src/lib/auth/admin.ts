import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_LOGIN_PATH } from "./admin-routes";

export type AdminSession = { userId: string; email: string | null };

export type AuthState =
  | { status: "anonymous" }
  | { status: "forbidden"; email: string | null }
  | { status: "admin"; session: AdminSession };

/**
 * Validates the session JWT (getClaims) and asks the database whether the user
 * is an active admin (public.is_admin → private.admin_users). Fails closed:
 * any RPC error is treated as "forbidden". Deduplicated per request.
 */
export const getAuthState = cache(async (): Promise<AuthState> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims?.sub) return { status: "anonymous" };

  const email = typeof claims.email === "string" ? claims.email : null;
  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError || isAdmin !== true) return { status: "forbidden", email };

  return { status: "admin", session: { userId: claims.sub, email } };
});

/** Server-side guard for every admin page, layout and Server Action. */
export async function requireAdmin(): Promise<AdminSession> {
  const state = await getAuthState();
  if (state.status !== "admin") redirect(ADMIN_LOGIN_PATH);
  return state.session;
}
