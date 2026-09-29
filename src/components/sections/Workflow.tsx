import { workflowPhases } from "@/constants/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Processo em linhas agrupadas por fase.
 *
 * A versão anterior era um grid de seis cards, cada um com o número da etapa
 * escrito como texto. Virou a quinta seção da home com a mesma silhueta de
 * colunas iguais, e o número era rótulo vazio: numa lista ordenada a posição já
 * comunica a sequência.
 *
 * `<ol>` porque a ordem é o conteúdo. A fase fica na coluna esquerda e as duas
 * etapas dela à direita, o que dá a esta seção uma silhueta que não se repete em
 * nenhuma outra parte da página.
 */
export function Workflow() {
  return (
    <section className="section-space bg-white/[.018]">
      <div className="container-shell">
        <SectionHeading title="Como funciona um projeto" />
        <ol className="mt-12 border-t border-white/8">
          {workflowPhases.map(({ phase, steps }) => (
            <li key={phase} className="grid gap-5 border-b border-white/8 py-8 md:grid-cols-[10rem_1fr] md:gap-10">
              <p className="text-lg font-bold text-blue-200/90">{phase}</p>
              <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
                {steps.map(([title, description]) => (
                  <div key={title}>
                    <h3 className="font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
