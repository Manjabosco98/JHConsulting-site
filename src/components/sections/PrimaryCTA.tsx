import { ArrowRight, MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Dois rótulos de chamada em toda a página, um por destino:
 * o formulário é sempre "Quero analisar meu processo" e o WhatsApp é sempre
 * "Solicitar orçamento". Antes havia quatro textos diferentes para a mesma
 * intenção ("Solicitar orçamento", "Quero analisar meu processo", "Vamos
 * conversar sobre seu projeto", "Falar pelo WhatsApp"), o que faz o visitante
 * comparar botões em vez de clicar num deles.
 */
export async function PrimaryCTA() {
  const settings = await getSiteSettings();
  return (
    <section className="py-12">
      <div className="container-shell">
        <div className="overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-700/30 to-cyan-500/5 p-8 sm:p-12">
          <h2 className="max-w-3xl text-3xl font-bold tracking-[-.03em] sm:text-5xl">
            Existe algum processo na sua empresa que toma tempo demais?
          </h2>
          <p className="mt-4 max-w-[62ch] text-slate-300">
            Talvez ele possa ser automatizado, integrado ou transformado em um sistema simples e confiável.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#contato"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-slate-950 transition hover:bg-slate-100 active:translate-y-px"
            >
              Quero analisar meu processo <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              href={whatsappLink(settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3.5 font-bold transition hover:bg-white/5 active:translate-y-px"
            >
              <MessageCircle size={18} aria-hidden="true" /> Solicitar orçamento
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
