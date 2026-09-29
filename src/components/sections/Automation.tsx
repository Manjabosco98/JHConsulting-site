import { CheckCircle2, ChevronRight } from "lucide-react";
import { automationBenefits, automationFlow } from "@/constants/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Automation() {
  return (
    <section className="section-space">
      <div className="container-shell">
        {/* Kicker removido: o título já começa com a palavra "Automação". */}
        <SectionHeading
          title="Automação não é apenas fazer tarefas mais rápido."
          copy="Automação significa criar processos mais confiáveis, padronizados, rastreáveis e escaláveis."
        />
        <ol className="mt-10 flex flex-wrap items-center gap-2">
          {automationFlow.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-xl border border-blue-400/18 bg-blue-500/7 px-4 py-3 text-sm font-bold">{step}</span>
              {index < automationFlow.length - 1 ? <ChevronRight className="text-slate-600" size={18} aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {automationBenefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-3 rounded-xl border border-white/8 p-4 text-sm text-slate-300">
              {/* Antes `text-emerald-400`: um terceiro acento, fora do azul e do
                * ciano da identidade, usado só como enfeite de marcador. */}
              <CheckCircle2 className="shrink-0 text-cyan-300" size={18} aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
