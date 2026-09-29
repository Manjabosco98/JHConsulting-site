import { requireAdmin } from "@/lib/auth/admin";

/**
 * Session-dependent slice of the admin header. Kept out of the panel layout so
 * the layout stays synchronous: an await for runtime data in a layout blocks
 * every navigation into the panel and suppresses the loading.tsx fallback.
 * Pages and Server Actions guard themselves; this redirect is a last resort.
 */
export async function AdminSessionEmail() {
  const session = await requireAdmin();
  return (
    <span className="mr-auto truncate text-sm text-slate-400 lg:mr-0" title={session.email ?? undefined}>
      {session.email}
    </span>
  );
}
