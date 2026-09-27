export const siteConfig = {
  name: "JHConsulting",
  professional: "João Henrique Manjabosco",
  role: "Analista de Sistemas • Desenvolvedor • Especialista em Automação",
  description:
    "Tecnologia, automação, sistemas, integrações e dados aplicados a problemas reais de negócios.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://seudominio.com.br",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "[EMAIL]",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "[WHATSAPP]",
  linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL ?? "[LINKEDIN]",
  github: process.env.NEXT_PUBLIC_GITHUB_URL ?? "[GITHUB]",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
  location: "Goiânia, Goiás, Brasil",
  serviceArea: "Atendimento remoto para empresas em todo o Brasil",
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

export const whatsappHref = (message = "Olá João, encontrei seu site da JHConsulting e gostaria de conversar sobre um projeto.") => {
  const phone = siteConfig.whatsapp.replace(/\D/g, "");
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#contato";
};
