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
/*
 * O painel é de duas colunas a partir de `lg`: texto à esquerda, os dois botões
 * empilhados à direita.
 *
 * Em uma coluna, o título estava limitado a `max-w-3xl` (768px) dentro de um
 * painel de 1180px e os botões ficavam embaixo dele: sobravam cerca de 380px
 * vazios à direita em qualquer tela de notebook para cima, e a seção lia como
 * conteúdo perdido num painel grande demais. A largura não mudou — o que mudou é
 * que agora ela é ocupada, e pelos botões, que é o que a seção existe para
 * oferecer.
 *
 * O título passou a usar `.section-title`, a mesma escala dos outros títulos da
 * página, em vez de `text-3xl sm:text-5xl`. Numa coluna mais estreita, 48px
 * quebrava em quatro linhas, e um tamanho só para esta seção era um valor fora da
 * escala tipográfica sem motivo: o destaque dela vem do painel com gradiente.
 */
export async function PrimaryCTA() {
  const settings = await getSiteSettings();
  return (
    <section className="section-space-tight">
      <div className="container-shell">
        <div className="overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-700/30 to-cyan-500/5 p-6 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.5fr_auto] lg:items-center lg:gap-14">
            <div>
              <h2 className="section-title mt-0">
                Existe algum processo na sua empresa que toma tempo demais?
              </h2>
              <p className="section-copy">
                Talvez ele possa ser automatizado, integrado ou transformado em um sistema simples e confiável.
              </p>
            </div>
            {/*
              * Empilhados e de largura igual no mobile, lado a lado em `sm`, e de
              * volta à pilha em `lg`, onde formam a coluna da direita. Em 320px o
              * rótulo mais longo ("Quero analisar meu processo") não cabe em uma
              * linha dentro do painel em nenhum tamanho de fonte razoável, então
              * ele centraliza e quebra em duas — o que a largura total e o
              * `text-center` tornam intencional em vez de acidental.
              */}
            <div className="grid gap-3 sm:flex sm:flex-wrap lg:grid">
              <a
                href="#contato"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-white px-5 py-3.5 text-center font-bold text-slate-950 transition hover:bg-slate-100 active:translate-y-px"
              >
                Quero analisar meu processo <ArrowRight size={18} aria-hidden="true" className="shrink-0" />
              </a>
              <a
                href={whatsappLink(settings.whatsapp)}
                target="_blank"
                rel="noreferrer"
                className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-5 py-3.5 text-center font-bold transition hover:bg-white/5 active:translate-y-px"
              >
                <MessageCircle size={18} aria-hidden="true" className="shrink-0" /> Solicitar orçamento
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
