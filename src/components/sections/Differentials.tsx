import { LifeBuoy, Puzzle, ScanSearch, SlidersHorizontal, TrendingUp } from "lucide-react";
import { differentiators } from "@/constants/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

const icons = [Puzzle, ScanSearch, SlidersHorizontal, TrendingUp, LifeBuoy] as const;

export function Differentials() {
  return (
    <section className="section-space">
      <div className="container-shell">
        <SectionHeading title="A JHConsulting não vende apenas código. Analisa processos e desenvolve soluções." />

        <div className="mt-12 grid gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-6">
          {differentiators.map(([title, description], index) => {
            const Icon = icons[index];
            return (
              <article key={title} className={`min-w-0 border-t border-white/10 pt-6 ${index < 3 ? "lg:col-span-2" : "lg:col-span-3"} ${index === 4 ? "md:col-span-2 lg:col-span-3" : ""}`}>
                <span className="flex size-10 items-center text-blue-300">
                  <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
