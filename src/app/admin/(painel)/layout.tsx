import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { logout } from "../actions";

// Protected area: every page here is rendered only for active admins.
// Pages and Server Actions must call requireAdmin() too (layouts do not
// re-run on client navigation). Full layout/sidebar: phase 6.
export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10">
        <div className="container-shell flex items-center justify-between gap-4 py-4">
          <p className="font-black">JHConsulting <span className="text-slate-400">· Painel</span></p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="hidden sm:inline">{session.email}</span>
            <form action={logout}>
              <button className="focus-ring inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-bold text-slate-200 hover:bg-white/5">
                Sair <LogOut size={15} />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container-shell py-10">{children}</main>
    </div>
  );
}
