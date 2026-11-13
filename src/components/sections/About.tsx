import { ArrowRight, Check, MapPin, Globe } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";

const commitments = [
  ["Processos mais organizados", "Rotinas estruturadas para reduzir retrabalho e dar mais controle à operação."],
  ["Informações conectadas", "Sistemas e dados trabalhando juntos para facilitar o dia a dia da empresa."],
  ["Decisões com mais clareza", "Indicadores que ajudam a acompanhar o negócio e identificar prioridades."]
] as const;

/** Personal biography and portrait stay out of the public site. */
export async function About() {
  const settings = await getSiteSettings();
  return (
    <section id="empresa" className="section-space border-t border-white/5">
      <div className="container-shell grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:gap-20">
        <div>
          <p className="section-kicker">A JHConsulting</p>
          <h2 className="section-title">Tecnologia próxima da realidade do seu negócio.</h2>
          <p className="section-copy">
            A JHConsulting é uma empresa de tecnologia com foco em automação, dados e desenvolvimento de soluções empresariais.
            Sua atuação começa pelo entendimento da operação: o que consome tempo, onde a informação se perde e o que precisa funcionar melhor.
          </p>
          <p className="section-copy">
            A partir desse diagnóstico, a empresa estrutura soluções sob medida para conectar ferramentas, simplificar rotinas e transformar dados em informação útil para a gestão.
          </p>
          <dl className="mt-8 grid gap-5 border-t border-white/10 pt-6 sm:grid-cols-2">
            {settings.location ? <div><dt className="flex items-center gap-2 text-sm font-bold text-blue-200"><MapPin size={16} aria-hidden="true" />Base</dt><dd className="mt-2 text-sm leading-6 text-slate-400">{settings.location}</dd></div> : null}
            {settings.serviceArea ? <div><dt className="flex items-center gap-2 text-sm font-bold text-blue-200"><Globe size={16} aria-hidden="true" />Atendimento</dt><dd className="mt-2 text-sm leading-6 text-slate-400">{settings.serviceArea}</dd></div> : null}
          </dl>
        </div>
        <div className="company-panel rounded-3xl border border-blue-400/20 p-6 sm:p-8 lg:p-10">
          <p className="text-sm font-semibold text-blue-200">O que orienta cada solução</p>
          <ul className="mt-7 space-y-7">
            {commitments.map(([title, copy]) => <li key={title} className="flex gap-4"><Check size={20} className="mt-1 shrink-0 text-cyan-300" aria-hidden="true" /><div><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-slate-300">{copy}</p></div></li>)}
          </ul>
          <a href="#servicos" className="focus-ring mt-9 inline-flex items-center gap-2 font-bold text-blue-200">Conhecer os serviços <ArrowRight size={17} aria-hidden="true" /></a>
        </div>
      </div>
    </section>
  );
}
