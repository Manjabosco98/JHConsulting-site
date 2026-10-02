import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";

/*
 * 1.06/0.94 e não 1.1/0.9: a arte precisa de área para ler como peça, mas a
 * manchete subiu para 52px e, com a coluna da esquerda abaixo de ~580px, parte
 * numa quarta linha a 1440px. Esta razão dá 591px à esquerda e 525px à direita,
 * que é o ponto onde as duas cabem sem nenhuma ceder.
 */
const LAYOUT =
  "hero-layout container-shell relative z-10 grid items-center gap-10 py-14 sm:py-20 lg:gap-12 lg:grid-cols-[1.06fr_.94fr] xl:gap-16";

/**
 * O núcleo de integração.
 *
 * A peça anterior era um diagrama de nós em traço de 1,5px, sem massa nem faixa
 * de valores: tudo na mesma luminosidade, lido como wireframe técnico e não como
 * arte. Esta versão é uma escultura, construída em camadas da mais distante para
 * a mais próxima — campo de pontos, órbitas, fluxos, núcleo — porque profundidade
 * é o que separa uma composição de um esquema.
 *
 * O núcleo é um cubo isométrico: três losangos que partilham o vértice central,
 * cada um com o seu próprio gradiente. Isto dá volume real (face de cima clara,
 * laterais escuras) em vez do contorno vazio de antes, e retoma o motivo do cubo
 * já presente no ícone da marca.
 *
 * `pathLength={100}` normaliza os seis fluxos: com ele, o mesmo `strokeDasharray`
 * produz um pulso do mesmo tamanho em curvas de comprimentos diferentes, e um só
 * par de regras CSS anima todas. Os pulsos da esquerda correm para dentro e os da
 * direita para fora — é a frase da página ("processos manuais" → "soluções")
 * dita em movimento, não um efeito solto.
 *
 * Tudo é SVG estático servido pelo servidor: nenhuma dependência, nenhum canvas,
 * nenhum JavaScript acima da dobra. A animação é CSS e desliga em
 * `prefers-reduced-motion`.
 */
function CoreVisual() {
  return (
    <div className="hero-figure" aria-hidden="true">
      <span className="hero-figure-bloom" />
      {/* `slice` em vez do `meet` por omissão: no desktop a proporção do
          elemento é 1:1 e os dois são idênticos, mas no telefone o CSS achata a
          caixa para 1.35:1 e `slice` recorta o ar em cima e em baixo em vez de
          encolher a peça inteira. */}
      <svg
        className="hero-figure-svg"
        viewBox="0 0 600 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        strokeLinecap="round"
      >
        <defs>
          {/* Campo de pontos: nulo no centro, para o núcleo ficar limpo, e nulo
              na borda, para não terminar num corte reto. */}
          <pattern id="hero-field" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1" fill="var(--jh-primary)" />
          </pattern>
          <radialGradient id="hero-field-falloff">
            <stop offset=".18" stopColor="#fff" stopOpacity="0" />
            <stop offset=".46" stopColor="#fff" stopOpacity=".42" />
            <stop offset=".78" stopColor="#fff" stopOpacity=".14" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
          <mask id="hero-field-mask">
            <rect width="600" height="600" fill="url(#hero-field-falloff)" />
          </mask>

          {/* Cada órbita acende num lado diferente: é o que faz um elipse lida
              como anel em perspetiva em vez de uma forma plana. */}
          <linearGradient id="hero-orbit-a" x1="48" y1="240" x2="552" y2="360" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--jh-primary)" stopOpacity="0" />
            <stop offset=".34" stopColor="var(--jh-primary)" stopOpacity=".42" />
            <stop offset=".72" stopColor="var(--jh-accent)" stopOpacity=".58" />
            <stop offset="1" stopColor="var(--jh-accent)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-orbit-b" x1="540" y1="180" x2="60" y2="420" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--jh-accent)" stopOpacity="0" />
            <stop offset=".38" stopColor="var(--jh-accent)" stopOpacity=".34" />
            <stop offset=".76" stopColor="var(--jh-primary)" stopOpacity=".3" />
            <stop offset="1" stopColor="var(--jh-primary)" stopOpacity="0" />
          </linearGradient>

          {/* Os fluxos desvanecem para transparente na extremidade exterior: sem
              isso cada curva acabaria num corte abrupto a meio do fundo. */}
          <linearGradient id="hero-flow-in" x1="30" y1="300" x2="300" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--jh-primary)" stopOpacity="0" />
            <stop offset=".42" stopColor="var(--jh-primary)" stopOpacity=".5" />
            <stop offset="1" stopColor="var(--jh-accent)" stopOpacity=".85" />
          </linearGradient>
          <linearGradient id="hero-flow-out" x1="300" y1="300" x2="570" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--jh-accent)" stopOpacity=".85" />
            <stop offset=".58" stopColor="var(--jh-primary)" stopOpacity=".5" />
            <stop offset="1" stopColor="var(--jh-primary)" stopOpacity="0" />
          </linearGradient>

          {/* As três faces do cubo. A de cima recebe a luz, as laterais afundam —
              a amplitude entre elas é o que dá volume. */}
          <linearGradient id="hero-core-top" x1="238" y1="228" x2="362" y2="300" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--jh-accent)" stopOpacity=".92" />
            <stop offset="1" stopColor="var(--jh-primary)" stopOpacity=".78" />
          </linearGradient>
          <linearGradient id="hero-core-left" x1="238" y1="264" x2="300" y2="372" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--jh-deep-blue)" stopOpacity=".85" />
            <stop offset="1" stopColor="var(--jh-navy)" stopOpacity=".96" />
          </linearGradient>
          <linearGradient id="hero-core-right" x1="362" y1="264" x2="300" y2="372" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--jh-primary)" stopOpacity=".52" />
            <stop offset="1" stopColor="var(--jh-deep-blue)" stopOpacity=".72" />
          </linearGradient>
          <radialGradient id="hero-core-halo">
            <stop stopColor="var(--jh-accent)" stopOpacity=".36" />
            <stop offset=".55" stopColor="var(--jh-primary)" stopOpacity=".12" />
            <stop offset="1" stopColor="var(--jh-primary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="600" height="600" fill="url(#hero-field)" mask="url(#hero-field-mask)" opacity=".55" />

        <circle className="hero-halo" cx="300" cy="300" r="190" fill="url(#hero-core-halo)" />

        <g fill="none">
          <ellipse
            cx="300"
            cy="300"
            rx="252"
            ry="88"
            transform="rotate(-16 300 300)"
            stroke="url(#hero-orbit-a)"
            strokeWidth="1.1"
          />
          <ellipse
            cx="300"
            cy="300"
            rx="198"
            ry="134"
            transform="rotate(30 300 300)"
            stroke="url(#hero-orbit-b)"
            strokeWidth="1.1"
          />
          <circle cx="300" cy="300" r="196" stroke="var(--jh-primary)" strokeOpacity=".09" strokeWidth="1" />
        </g>

        {/* Fluxos: três convergem da esquerda, três irradiam à direita. */}
        <g strokeWidth="1.3">
          <g stroke="url(#hero-flow-in)">
            <path d="M44 198C134 208 172 252 236 268" />
            <path d="M30 300C110 300 166 300 236 300" />
            <path d="M52 408C140 400 176 348 236 332" />
          </g>
          <g stroke="url(#hero-flow-out)">
            <path d="M364 268C428 252 462 198 556 184" />
            <path d="M364 300C444 300 498 300 570 300" />
            <path d="M364 332C428 348 460 396 548 410" />
          </g>
        </g>

        {/* Pulsos. Mesmo traçado dos fluxos, em cima deles. */}
        <g className="hero-pulses" strokeWidth="2" strokeDasharray="7 100">
          <g stroke="url(#hero-flow-in)">
            <path pathLength={100} d="M44 198C134 208 172 252 236 268" style={{ animationDelay: "0s" }} />
            <path pathLength={100} d="M30 300C110 300 166 300 236 300" style={{ animationDelay: "2.4s" }} />
            <path pathLength={100} d="M52 408C140 400 176 348 236 332" style={{ animationDelay: "4.1s" }} />
          </g>
          <g stroke="url(#hero-flow-out)">
            <path pathLength={100} d="M364 268C428 252 462 198 556 184" style={{ animationDelay: "1.2s" }} />
            <path pathLength={100} d="M364 300C444 300 498 300 570 300" style={{ animationDelay: "3.6s" }} />
            <path pathLength={100} d="M364 332C428 348 460 396 548 410" style={{ animationDelay: "5.3s" }} />
          </g>
        </g>

        {/* Pontos de passagem: o detalhe de escala pequena que recompensa o
            segundo olhar. Sem eles as curvas ficam lisas demais. */}
        <g className="hero-nodes">
          <g fill="var(--jh-primary)" fillOpacity=".55">
            <circle cx="150" cy="221" r="2.5" />
            <circle cx="133" cy="300" r="2.5" />
            <circle cx="157" cy="376" r="2.5" />
            <circle cx="452" cy="223" r="2.5" />
            <circle cx="468" cy="300" r="2.5" />
            <circle cx="449" cy="372" r="2.5" />
          </g>
          <g fill="var(--jh-primary)">
            <circle cx="44" cy="198" r="4.5" />
            <circle cx="30" cy="300" r="3.5" />
            <circle cx="52" cy="408" r="4.5" />
          </g>
          <g fill="var(--jh-accent)">
            <circle cx="556" cy="184" r="4.5" />
            <circle cx="570" cy="300" r="4" />
            <circle cx="548" cy="410" r="4.5" />
          </g>
        </g>

        {/* O núcleo. Vértice central partilhado pelas três faces. */}
        <g className="hero-core">
          <path d="M300 300 237.6 264 300 228 362.4 264Z" fill="url(#hero-core-top)" />
          <path d="M300 300 237.6 264 237.6 336 300 372Z" fill="url(#hero-core-left)" />
          <path d="M300 300 362.4 264 362.4 336 300 372Z" fill="url(#hero-core-right)" />
          <path
            d="M300 228 362.4 264 362.4 336 300 372 237.6 336 237.6 264Z"
            stroke="var(--jh-accent)"
            strokeOpacity=".55"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          <path
            d="M300 300 237.6 264M300 300 362.4 264M300 300 300 372"
            stroke="var(--jh-accent)"
            strokeOpacity=".3"
            strokeWidth="1"
          />
        </g>
      </svg>
    </div>
  );
}

export async function Hero() {
  const settings = await getSiteSettings();

  return (
    <section id="inicio" className="hero-surface overflow-hidden">
      <svg
        className="hero-curves pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        <path d="M 1610 -160 C 1390 15 1220 105 1195 320 S 1280 630 1510 760" />
        <path d="M 1510 -185 C 1290 20 1135 135 1120 315 S 1170 575 1400 750" />
        <path d="M -260 110 C -20 205 95 380 45 595 S -50 745 -125 795" />
      </svg>
      <div className={LAYOUT}>
        <div className="hero-copy">
          <p className="hero-badge">
            <CheckCircle2 size={14} aria-hidden="true" /> Tecnologia aplicada a problemas reais de negócios
          </p>
          <h1 className="hero-title mt-7">
            Transformo processos manuais em soluções <span className="text-gradient">inteligentes.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-base leading-8 text-slate-300 sm:text-lg">
            Sistemas, automações, integrações e dados para empresas que querem operar com menos trabalho manual.
          </p>
          <div className="mt-9 grid gap-3 sm:flex sm:flex-wrap">
            <a
              href={whatsappLink(settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="btn-primary focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold"
            >
              Solicitar orçamento <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              href="#solucoes"
              className="btn-ghost focus-ring inline-flex items-center justify-center rounded-xl px-5 py-3.5 font-bold text-slate-200"
            >
              Conhecer soluções
            </a>
          </div>
        </div>
        <CoreVisual />
      </div>
    </section>
  );
}
