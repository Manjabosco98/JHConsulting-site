import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { AdminSessionEmail } from "@/components/admin/AdminSessionEmail";
import { logout } from "../actions";

// Protected area: every page here is rendered only for active admins.
// Pages and Server Actions must call requireAdmin() too (layouts do not
// re-run on client navigation).
//
// This layout stays synchronous on purpose. Awaiting runtime data here (the
// session) blocks every navigation into the panel and suppresses the
// loading.tsx fallback, so the whole panel feels frozen until the auth round
// trips finish. The session lookup lives in <AdminSessionEmail/> behind
// <Suspense/>, which lets the shell and the loading state paint immediately.
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="border-b border-white/10 bg-[#0a101d]/80 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-4 px-4 py-4 lg:px-5 lg:py-6">
          <Link href="/admin" className="focus-ring rounded-lg font-black">
            JHConsulting <span className="font-bold text-slate-500">· Painel</span>
          </Link>
        </div>
        <div className="px-3 pb-3 lg:flex-1 lg:px-3">
          <AdminNav />
        </div>
        <div className="hidden border-t border-white/10 p-3 lg:block">
          <Link href="/" target="_blank" className="focus-ring inline-flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200">
            <ExternalLink size={17} aria-hidden="true" /> Ver site
          </Link>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b border-white/10">
          <div className="flex items-center justify-end gap-3 px-4 py-3 sm:px-8">
            <Suspense fallback={<span className="mr-auto h-5 w-40 max-w-[40vw] rounded bg-white/5 lg:mr-0" aria-hidden="true" />}>
              <AdminSessionEmail />
            </Suspense>
            <Link href="/" target="_blank" className="focus-ring rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 lg:hidden" aria-label="Ver site">
              <ExternalLink size={17} aria-hidden="true" />
            </Link>
            {/* globals.css sets `font: inherit` on buttons outside @layer, which
                overrides Tailwind font utilities: size/weight go on the parent. */}
            <form action={logout} data-form="logout" className="text-sm font-bold">
              <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/5">
                Sair <LogOut size={15} aria-hidden="true" />
              </button>
            </form>
          </div>
        </header>
        <main className="px-4 py-8 sm:px-8 lg:py-10">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
