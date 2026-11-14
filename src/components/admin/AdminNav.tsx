"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Cpu, LayoutDashboard, MessageSquare, Settings, Wrench, type LucideIcon } from "lucide-react";
import { adminNavItems, adminTechnicalNavItems, isActiveNav } from "@/lib/admin/navigation";

const icons: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/servicos": Wrench,
  "/admin/tecnologias": Cpu,
  "/admin/contatos": MessageSquare,
  "/admin/configuracoes": Settings
};

export function AdminNav() {
  const pathname = usePathname();
  function item({ href, label }: { href: string; label: string }) {
    const Icon = icons[href];
    const active = isActiveNav(pathname, href);
    return (
      <Link key={href} href={href} aria-current={active ? "page" : undefined}
        className={`focus-ring inline-flex shrink-0 items-center gap-3 rounded-xl border px-3 py-3 text-sm font-bold transition-colors ${active ? "border-blue-400/20 bg-blue-500/12 text-blue-100" : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white"}`}>
        <Icon size={18} aria-hidden="true" />{label}
      </Link>
    );
  }
  return (
    <nav aria-label="Painel" className="grid gap-5">
      <div className="flex flex-wrap gap-1 lg:grid">
        {adminNavItems.map(item)}
      </div>
      <details className="group border-t border-white/8 pt-4" open={adminTechnicalNavItems.some(({href}) => isActiveNav(pathname, href)) || undefined}>
        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-400 [&::-webkit-details-marker]:hidden">
          Configurações técnicas<ChevronDown size={15} className="transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="mt-2 grid gap-1">{adminTechnicalNavItems.map(item)}</div>
      </details>
    </nav>
  );
}
