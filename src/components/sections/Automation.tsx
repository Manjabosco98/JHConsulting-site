import { Activity, Bot, CheckCircle2, ChevronRight, ClipboardList, ScanSearch, TrendingUp, type LucideIcon } from "lucide-react";
import { automationBenefits, automationFlow } from "@/constants/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ICONS = { ClipboardList, ScanSearch, Bot, Activity, TrendingUp } satisfies Record<string, LucideIcon>;

export function Automation() {
  return (
    <section className="section-space rule-top">
      <div className="container-shell">
        <SectionHeading
          title="Automação não é apenas fazer tarefas mais rápido."
          copy="Automação significa criar processos mais confiáveis, padronizados, rastreáveis e escaláveis."
        />
        <ol className="mt-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {automationFlow.map(([step, description, icon], index) => {
            const Icon = ICONS[icon];
            return (
              <li key={step} className="card relative min-w-0 rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="icon-tile">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <span className="font-mono text-xs font-medium tabular-nums text-blue-200/65" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-bold leading-snug">{step}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                {index < automationFlow.length - 1 ? (
                  <ChevronRight
                    className="absolute -right-[1.1rem] top-8 z-10 hidden text-blue-300/45 lg:block"
                    size={16}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>
        <ul className="mt-7 flex flex-wrap gap-2">
          {automationBenefits.map((benefit) => (
            <li key={benefit} className="inline-flex items-center gap-2 rounded-full border border-blue-400/15 bg-blue-500/5 px-3 py-2 text-sm text-slate-300">
              <CheckCircle2 className="shrink-0 text-cyan-300" size={15} aria-hidden="true" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
