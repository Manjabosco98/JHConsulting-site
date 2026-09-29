import { differentiators } from "@/constants/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Diferenciais como lista dividida, sem cards.
 *
 * Eram cinco cards em `lg:grid-cols-5`: colunas de cerca de 220px dentro de um
 * container de 1180px, e no breakpoint `md` a grade de duas colunas deixava a
 * quinta célula órfã. O primeiro item ocupa a linha inteira como abertura e os
 * outros quatro fecham duas colunas exatas.
 *
 * Aqui não há caixa nenhuma: o agrupamento vem do espaço e de um fio, porque
 * elevação só se justifica quando comunica hierarquia real, e cinco afirmações
 * de mesmo peso não têm hierarquia entre si.
 */
export function Differentials() {
  const [lead, ...rest] = differentiators;

  return (
    <section className="section-space">
      <div className="container-shell">
        <SectionHeading title="A JHConsulting não vende apenas código. Analisa processos e desenvolve soluções." />

        <div className="mt-12 grid gap-x-12 gap-y-8 border-t border-white/8 pt-8 md:grid-cols-2">
          <div className="md:col-span-2">
            <h3 className="text-xl font-bold">{lead[0]}</h3>
            <p className="mt-3 max-w-[58ch] leading-7 text-slate-400">{lead[1]}</p>
          </div>
          {rest.map(([title, description]) => (
            <div key={title} className="border-t border-white/8 pt-8">
              <h3 className="font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
