export type AdminNavItem = { href: string; label: string };

export const adminNavItems: readonly AdminNavItem[] = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/contatos", label: "Contatos" },
  { href: "/admin/servicos", label: "Serviços" },
  { href: "/admin/configuracoes", label: "Configurações" }
];

export const adminTechnicalNavItems: readonly AdminNavItem[] = [
  { href: "/admin/tecnologias", label: "Tecnologias" }
];

/** The overview is active only on /admin; sections also match their sub-routes. */
export function isActiveNav(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
