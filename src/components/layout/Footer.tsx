import { Mail, MessageCircle, MapPin } from "lucide-react";
import { siteConfig } from "@/constants/site";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";

export async function Footer({ internal = false }: { internal?: boolean } = {}) {
  const settings = await getSiteSettings();
  const to = (href: string) => internal ? `/${href}` : href;
  return (
    <footer className="section-space-tight border-t border-blue-400/10 bg-navy">
      <div className="container-shell grid gap-9 md:grid-cols-[1.3fr_1fr_1.2fr] md:gap-10">
        <div>
          <p className="text-lg font-black">JH<span className="text-blue-400">Consulting</span></p>
          <p className="mt-3 max-w-sm text-sm leading-7 text-slate-400">Automação, dados e sistemas para simplificar processos e apoiar a gestão da sua empresa.</p>
        </div>
        <div>
          <p className="text-sm font-bold">A empresa</p>
          <nav aria-label="Navegação do rodapé" className="mt-4 grid gap-3 text-sm text-slate-300">
            {siteConfig.nav.map(([label, href]) => <a key={href} href={to(href)} className="focus-ring w-fit rounded transition hover:text-white">{label}</a>)}
          </nav>
        </div>
        <div>
          <p className="text-sm font-bold">Contato comercial</p>
          <div className="mt-4 grid gap-4 text-sm leading-6 text-slate-300">
            {settings.whatsapp ? <a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noreferrer" className="focus-ring flex w-fit items-center gap-3"><MessageCircle className="shrink-0 text-blue-300" size={18} aria-hidden="true" />Falar pelo WhatsApp</a> : null}
            {settings.email ? <a href={`mailto:${settings.email}`} className="focus-ring flex w-fit items-start gap-3 break-all"><Mail className="mt-1 shrink-0 text-blue-300" size={18} aria-hidden="true" />{settings.email}</a> : null}
            {settings.location ? <p className="flex items-start gap-3"><MapPin className="mt-1 shrink-0 text-blue-300" size={18} aria-hidden="true" />{settings.location}</p> : null}
            {settings.serviceArea ? <p className="text-slate-400">{settings.serviceArea}</p> : null}
          </div>
        </div>
      </div>
      <div className="container-shell mt-8 border-t border-white/5 pr-16 pt-6 text-xs leading-6 text-slate-400 sm:pr-0">
        © {new Date().getFullYear()} {settings.companyName}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
