export type AdminNavItem = { href: string; label: string };

export const adminNavItems: readonly AdminNavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/projetos", label: "Projetos" },
  { href: "/admin/servicos", label: "Serviços" },
  { href: "/admin/tecnologias", label: "Tecnologias" },
  { href: "/admin/contatos", label: "Contatos" },
  { href: "/admin/configuracoes", label: "Configurações" }
];

/** The dashboard is active only on /admin itself; sections also match their sub-routes. */
export function isActiveNav(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
