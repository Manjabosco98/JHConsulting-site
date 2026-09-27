import { ArrowRight, CheckCircle2, Cpu, Database, Network, Sparkles } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";

export async function Hero() {
  const settings = await getSiteSettings();
  return (
    <section id="inicio" className="grid-lines overflow-hidden border-b border-white/5">
      <div className="container-shell grid min-h-[78vh] items-center gap-12 py-20 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/7 px-3 py-1.5 text-xs font-bold text-blue-200"><CheckCircle2 size={14}/> Tecnologia aplicada a problemas reais de negócios</div>
          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">Transformo processos manuais em <span className="text-gradient">soluções inteligentes.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">Desenvolvimento de sistemas, automações, APIs, integrações e soluções de dados para empresas que querem trabalhar com mais eficiência e menos tarefas repetitivas.</p>
          <div className="mt-8 flex flex-wrap gap-3"><a href={whatsappLink(settings.whatsapp)} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold hover:bg-blue-500">Solicitar orçamento <ArrowRight size={18}/></a><a href="#solucoes" className="focus-ring rounded-xl border border-white/12 px-5 py-3.5 font-bold text-slate-200 hover:bg-white/5">Conhecer soluções</a></div>
          <div className="mt-8 text-sm text-slate-400"><p className="font-bold text-slate-200">{settings.professionalName}</p><p>{settings.role}</p></div>
        </div>
        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-12 bg-blue-500/10 blur-3xl"/>
          <div className="card relative rounded-[2rem] p-5 sm:p-7">
            <div className="flex items-center justify-between border-b border-white/8 pb-4"><div><p className="text-xs uppercase tracking-[.18em] text-slate-500">Process intelligence</p><p className="mt-1 font-bold">JHConsulting Core</p></div><div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_22px_rgba(52,211,153,.8)]"/></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[[Cpu,"Automação","Tarefas repetitivas → fluxo confiável"],[Network,"Integrações","Sistemas isolados → dados conectados"],[Database,"Dados","Informação dispersa → decisão"],[Sparkles,"IA aplicada","Processos manuais → assistência inteligente"]].map(([Icon,title,desc]) => {
                const I = Icon as typeof Cpu;
                return <div key={String(title)} className="rounded-2xl border border-white/8 bg-black/15 p-4"><I className="text-blue-400" size={22}/><p className="mt-5 font-bold">{String(title)}</p><p className="mt-1 text-sm leading-6 text-slate-400">{String(desc)}</p></div>
              })}
            </div>
            <div className="mt-4 rounded-2xl border border-blue-400/15 bg-blue-500/5 p-4"><div className="flex items-center justify-between text-xs text-slate-400"><span>Diagnóstico</span><span>→</span><span>Arquitetura</span><span>→</span><span>Entrega</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full w-[86%] rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"/></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
