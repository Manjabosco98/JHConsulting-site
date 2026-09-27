import { Github, Linkedin, Mail } from "lucide-react";
import { siteConfig } from "@/constants/site";

export function Footer() {
  return (
    <footer className="border-t border-white/8 py-10">
      <div className="container-shell grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div><p className="text-lg font-black">JH<span className="text-blue-400">Consulting</span></p><p className="mt-3 max-w-md text-sm leading-7 text-slate-400">Tecnologia, automação e dados aplicados a negócios.</p></div>
        <div><p className="text-sm font-bold">Navegação</p><div className="mt-3 grid gap-2 text-sm text-slate-400">{siteConfig.nav.slice(0,5).map(([l,h]) => <a key={h} href={h} className="hover:text-white">{l}</a>)}</div></div>
        <div><p className="text-sm font-bold">Conecte-se</p><div className="mt-4 flex gap-3">{siteConfig.linkedin !== "[LINKEDIN]" && <a aria-label="LinkedIn" href={siteConfig.linkedin} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 p-2 hover:bg-white/5"><Linkedin size={18}/></a>}{siteConfig.github !== "[GITHUB]" && <a aria-label="GitHub" href={siteConfig.github} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 p-2 hover:bg-white/5"><Github size={18}/></a>}<a aria-label="Email" href={`mailto:${siteConfig.email}`} className="rounded-lg border border-white/10 p-2 hover:bg-white/5"><Mail size={18}/></a></div></div>
      </div>
      <div className="container-shell mt-8 border-t border-white/5 pt-6 text-xs text-slate-500">© {new Date().getFullYear()} JHConsulting — Todos os direitos reservados.</div>
    </footer>
  );
}
