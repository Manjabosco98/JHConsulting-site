import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "@/lib/supabase/env";
import { resolveAdminRedirect } from "@/lib/auth/admin-routes";

/**
 * Refreshes the Supabase session cookies for /admin and redirects visitors
 * without a session to the login page. Authorization (admin role) is enforced
 * on the server by requireAdmin(); this is only an optimistic check.
 */
export async function proxy(request: NextRequest) {
  const { url, publishableKey } = getSupabasePublicConfig();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Responses carrying auth cookies must never be cached by a CDN/proxy.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      }
    }
  });

  // Validates the JWT and refreshes an expired session. Keep this call directly
  // after creating the client.
  const { data } = await supabase.auth.getClaims();
  const target = resolveAdminRedirect(request.nextUrl.pathname, Boolean(data?.claims?.sub));

  if (target) {
    const redirectResponse = NextResponse.redirect(new URL(target, request.url));
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    for (const key of ["cache-control", "expires", "pragma"]) {
      const value = response.headers.get(key);
      if (value) redirectResponse.headers.set(key, value);
    }
    response = redirectResponse;
  }

  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"]
};
