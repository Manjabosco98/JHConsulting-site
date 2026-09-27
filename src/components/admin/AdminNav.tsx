"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, FolderKanban, LayoutDashboard, MessageSquare, Settings, Wrench, type LucideIcon } from "lucide-react";
import { adminNavItems, isActiveNav } from "@/lib/admin/navigation";

const icons: Record<string, LucideIcon> = {
  "/admin": LayoutDashboard,
  "/admin/projetos": FolderKanban,
  "/admin/servicos": Wrench,
  "/admin/tecnologias": Cpu,
  "/admin/contatos": MessageSquare,
  "/admin/configuracoes": Settings
};

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Painel" className="flex flex-wrap gap-1 lg:flex-col lg:flex-nowrap">
      {adminNavItems.map(({ href, label }) => {
        const Icon = icons[href];
        const active = isActiveNav(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`focus-ring inline-flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
              active ? "bg-blue-600/15 text-blue-200" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Icon size={17} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
