import { ArrowRight } from "lucide-react";
import { businessApplications } from "@/constants/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function Solutions() {
  return (
    <section id="resultados" className="section-space border-t border-white/5">
      <div className="container-shell">
        <SectionHeading title="Resultados que começam na rotina."
          copy="Veja como os serviços podem apoiar diferentes áreas da empresa. Cada aplicação é dimensionada conforme os sistemas, os dados e as necessidades do negócio." />
        <div className="mt-10 grid gap-x-12 md:grid-cols-2">
          {businessApplications.map(({ area, need, delivery, outcome }) => (
            <article key={area} className="border-t border-blue-400/20 py-7">
              <p className="text-xs font-bold uppercase tracking-widest text-blue-300">{area}</p>
              <h3 className="mt-3 text-xl font-bold">{outcome}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">{need}</p>
              <p className="mt-3 text-sm leading-7 text-slate-300"><span className="font-semibold text-slate-100">Como a JHConsulting pode ajudar: </span>{delivery}</p>
            </article>
          ))}
        </div>
        <a href="#contato" className="focus-ring mt-5 inline-flex items-center gap-2 font-bold text-blue-200">Encontrar a solução para minha empresa <ArrowRight size={17} aria-hidden="true" /></a>
      </div>
    </section>
  );
}
