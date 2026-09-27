import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import { siteConfig } from "@/constants/site";
import { getSiteSettings } from "@/lib/repositories/public-settings";

const socialClass = "focus-ring rounded-lg border border-white/10 p-2 hover:bg-white/5";

export async function Footer() {
  const settings = await getSiteSettings();
  // The wordmark is the logo treatment, not data: it stays in markup.
  return (
    <footer className="border-t border-white/8 py-10">
      <div className="container-shell grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="text-lg font-black">JH<span className="text-blue-400">Consulting</span></p>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-400">Tecnologia, automação e dados aplicados a negócios.</p>
        </div>
        <div>
          <p className="text-sm font-bold">Navegação</p>
          <div className="mt-3 grid gap-2 text-sm text-slate-400">
            {siteConfig.nav.slice(0, 5).map(([label, href]) => <a key={href} href={href} className="hover:text-white">{label}</a>)}
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
      <div className="container-shell mt-8 border-t border-white/5 pt-6 text-xs text-slate-500">
        © {new Date().getFullYear()} {settings.companyName} — Todos os direitos reservados.
      </div>
    </footer>
  );
}
