import { Plus } from "lucide-react";
import { frequentlyAskedQuestions } from "@/constants/content";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function FAQ() {
  return (
    <section className="section-space border-t border-white/5">
      <div className="container-shell grid gap-9 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
        <SectionHeading title="Antes de começar" copy="Respostas para quem busca uma solução e quer entender o próximo passo." />
        <div className="border-t border-white/10">
          {frequentlyAskedQuestions.map(([question, answer]) => (
            <details key={question} className="faq-item group border-b border-white/10">
              <summary className="focus-ring flex cursor-pointer list-none items-start justify-between gap-5 py-6 font-bold">
                {question}<Plus size={20} className="mt-0.5 shrink-0 text-blue-300 transition-transform group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="pb-6 pr-7 text-sm leading-7 text-slate-300">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
