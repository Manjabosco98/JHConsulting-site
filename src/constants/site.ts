/**
 * Deployment and structural configuration — deliberately *not* content.
 *
 * Everything a client would want to change (contato, redes, textos
 * institucionais) lives in `site_settings` and is edited in
 * /admin/configuracoes. What remains here is the brand name used when the
 * database cannot be read, the site URL (deployment configuration) and the
 * navigation structure, which matches the sections that exist in the code.
 */
export const siteConfig = {
  name: "JHConsulting",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://seudominio.com.br",
  nav: [
    ["Início", "#inicio"],
    ["Soluções", "#solucoes"],
    ["Serviços", "#servicos"],
    ["Projetos", "#projetos"],
    ["Tecnologias", "#tecnologias"],
    ["Sobre", "#sobre"],
    ["Contato", "#contato"]
  ] as const
};
