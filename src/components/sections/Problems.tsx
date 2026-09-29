import { ArrowRight, Check } from "lucide-react";
import { problems } from "@/constants/content";

export function Problems() {
  return (
    <section className="section-space">
      <div className="container-shell grid gap-12 lg:grid-cols-[.9fr_1.1fr]">
        <div>
          {/* Kicker removido: era um dos doze rótulos em caixa alta da home. */}
          <h2 className="section-title mt-0">Sua empresa ainda perde tempo com processos que poderiam ser automatizados?</h2>
          <p className="section-copy">
            Grande parte dessas atividades pode ser automatizada ou simplificada com sistemas, integrações, APIs e automações
            personalizadas.
          </p>
          <a href="#contato" className="focus-ring mt-8 inline-flex items-center gap-2 font-bold text-blue-300 transition hover:text-blue-200">
            Quero analisar meu processo <ArrowRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {problems.map((problem) => (
            <div key={problem} className="card flex gap-3 rounded-2xl p-4">
              <Check className="mt-1 shrink-0 text-cyan-300" size={18} aria-hidden="true" />
              <p className="text-sm leading-6 text-slate-300">{problem}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
