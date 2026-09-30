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
        {/*
          * Coluna no telefone, linha a partir de `sm`.
          *
          * Cinco etapas não cabem numa linha de 320px, e `flex-wrap` resolvia isso
          * quebrando onde sobrasse espaço: duas etapas numa linha, uma na outra,
          * com as setas apontando para os lados em pontos arbitrários. A sequência,
          * que é a única informação da lista, deixava de ser legível.
          *
          * Empilhada, cada etapa fica embaixo da anterior e a seta gira 90 graus
          * para apontar para ela. É o mesmo componente e o mesmo ícone; só a
          * direção do eixo muda, então não há regra por aparelho nem segunda
          * marcação para o mobile.
          *
          * A seta continua vindo antes da etapa, e não depois: assim ela sempre
          * acompanha o item para onde aponta, em qualquer largura e em qualquer
          * ponto de quebra, e nunca sobra uma seta no fim apontando para o nada.
          */}
        <ol className="mt-10 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap">
          {automationFlow.map((step, index) => (
            <li key={step} className="flex flex-col items-center gap-2 sm:flex-row">
              {index > 0 ? (
                <ChevronRight className="shrink-0 rotate-90 text-slate-600 sm:rotate-0" size={18} aria-hidden="true" />
              ) : null}
              <span className="rounded-xl border border-blue-400/18 bg-blue-500/7 px-4 py-3 text-center text-sm font-bold">{step}</span>
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
