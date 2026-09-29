import "server-only";

import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "./env";

/**
 * Request-scoped client using the user's cookies and the public key, never a secret key.
 * Memoized per request so layout, guard and page share one client instead of
 * re-reading cookies for every call.
 */
export const createClient = cache(async () => {
  const { url, publishableKey } = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Components cannot write cookies; src/proxy.ts refreshes the
          // session (with no-cache headers) for /admin. This factory alone does
          // not authorize: use requireAdmin() from src/lib/auth/admin.ts.
        }
      }
    }
  });
});
