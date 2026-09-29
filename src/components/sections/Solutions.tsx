import { solutions } from "@/constants/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Solutions() {
  return (
    <section id="solucoes" className="section-space bg-white/[.018]">
      <div className="container-shell">
        {/* Um dos quatro kickers que sobraram na home: o título não contém a
          * palavra "Soluções" e o menu aponta para esta âncora. */}
        <SectionHeading kicker="Soluções para empresas" title="Tecnologia aplicada onde o gargalo realmente acontece" />
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/8 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map(([title, description]) => (
            <article key={title} className="bg-[#0a101d] p-6">
              <h3 className="font-bold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
