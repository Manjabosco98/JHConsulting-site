import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import { siteConfig } from "@/constants/site";
import { getSiteSettings } from "@/lib/repositories/public-settings";

// `rounded-full`: botão de ícone, conforme a escala de raios em globals.css.
const socialClass = "focus-ring rounded-full border border-white/10 p-2.5 transition hover:bg-white/5";

/**
 * `internal` existe pelo mesmo motivo que na Navbar, e a falta dele aqui era um
 * link quebrado: as âncoras do rodapé eram sempre relativas (`#servicos`), e o
 * rodapé aparece também em /projetos e /projetos/[slug], onde não existe nenhuma
 * dessas seções. Clicar em "Serviços" no rodapé de uma página de projeto não
 * fazia nada. Com `internal`, o alvo passa a ser `/#servicos`.
 */
export async function Footer({ internal = false }: { internal?: boolean } = {}) {
  const settings = await getSiteSettings();
  const to = (href: string) => (internal ? `/${href}` : href);
  // The wordmark is the logo treatment, not data: it stays in markup.
  return (
    /*
     * `section-space-tight` no lugar de `py-10`: meia medida do ritmo das seções,
     * que acompanha a viewport como o resto da página em vez de ficar cravada em
     * 40px.
     *
     * A última coluna é `auto` e não `1fr`: com três frações, a coluna dos ícones
     * ficava com 295px para ocupar 200px, e sobrava um vão à direita do rodapé.
     * Dimensionada pelo conteúdo, ela encosta na margem e a folga vai para a
     * coluna de navegação.
     */
    <footer className="section-space-tight border-t border-white/8">
      <div className="container-shell grid gap-8 md:grid-cols-[1.5fr_1fr_auto] md:gap-12">
        <div>
          <p className="text-lg font-black">JH<span className="text-blue-400">Consulting</span></p>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">Tecnologia, automação e dados aplicados a negócios.</p>
        </div>
        <div>
          <p className="text-sm font-bold">Navegação</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-400">
            {siteConfig.nav.slice(0, 5).map(([label, href]) => <a key={href} href={to(href)} className="focus-ring rounded transition hover:text-white">{label}</a>)}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold">Conecte-se</p>
          <div className="mt-4 flex gap-3">
            {settings.linkedinUrl ? <a aria-label="LinkedIn" href={settings.linkedinUrl} target="_blank" rel="noreferrer" className={socialClass}><Linkedin size={18} /></a> : null}
            {settings.githubUrl ? <a aria-label="GitHub" href={settings.githubUrl} target="_blank" rel="noreferrer" className={socialClass}><Github size={18} /></a> : null}
            {settings.instagramUrl ? <a aria-label="Instagram" href={settings.instagramUrl} target="_blank" rel="noreferrer" className={socialClass}><Instagram size={18} /></a> : null}
            {settings.email ? <a aria-label="E-mail" href={`mailto:${settings.email}`} className={socialClass}><Mail size={18} /></a> : null}
          </div>
        </div>
      </div>
      {/* `slate-400` e não `slate-500`: #64748b sobre o fundo da página mede
        * 4,08:1, abaixo do mínimo de 4,5:1 da WCAG AA — e aqui o texto ainda é
        * `text-xs`, o caso em que o mínimo mais importa. */}
      {/* `pr-16` no telefone: o rodapé é o fim da página, e é ali que o botão
        * flutuante do WhatsApp (52px no canto inferior direito) para de passar
        * por cima de conteúdo que rola e fica parado sobre esta linha. O recuo
        * reserva a faixa dele para que o texto nunca corra por baixo. */}
      <div className="container-shell mt-8 border-t border-white/5 pr-16 pt-6 text-xs text-slate-400 sm:pr-0">
        © {new Date().getFullYear()} {settings.companyName}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
