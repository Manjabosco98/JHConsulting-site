import { Calculator, ChartNoAxesCombined, FileDown, Layers3, Network, Wallet, type LucideIcon } from "lucide-react";
import { solutions } from "@/constants/content";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const ICONS = { FileDown, Calculator, Wallet, Network, ChartNoAxesCombined, Layers3 } satisfies Record<string, LucideIcon>;

export function Solutions() {
  return (
    <section id="solucoes" className="section-space rule-top surface-raised">
      <div className="container-shell">
        <SectionHeading
          kicker="Soluções para empresas"
          title="Tecnologia aplicada onde o gargalo realmente acontece"
          copy="Automação, integração e dados podem apoiar rotinas de diferentes áreas da operação."
        />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {solutions.map(([title, description, icon], index) => {
            const Icon = ICONS[icon];
            return (
              <Reveal key={title} delay={Math.min(index * 0.04, 0.2)}>
                <article className="card h-full rounded-2xl p-5 transition-colors hover:border-blue-400/30">
                  <span className="icon-tile">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
