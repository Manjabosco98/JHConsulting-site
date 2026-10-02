import { Bot, ChartNoAxesCombined, Layers3, Network, type LucideIcon } from "lucide-react";
import { authority } from "@/constants/content";

/**
 * Os quatro pilares: ícone, título e frase, logo abaixo do Hero.
 *
 * `satisfies` e não anotação de tipo: assim as chaves continuam sendo os quatro
 * literais, e `ICONS[icon]` só compila enquanto todo nome declarado em
 * `content.ts` existir aqui. Se um dos dois lados mudar sem o outro, o erro
 * aparece no build e não como ícone faltando na página.
 */
const ICONS = { Bot, Layers3, Network, ChartNoAxesCombined } satisfies Record<string, LucideIcon>;

/**
 * Antes esta faixa era quatro células separadas por fios, sem ícone e sem caixa,
 * encostadas no Hero. Passou a ser quatro cards porque é o que a especificação do
 * redesign pede para os pilares, e o ícone é o que diferencia esta faixa de uma
 * lista de texto: ela é a primeira coisa depois do Hero e precisa ser varrida com
 * os olhos, não lida.
 *
 * Com caixa, a faixa deixa de poder ficar rente às seções vizinhas: os fios
 * antigos *eram* a separação. Daí o `section-space-tight`, a meia medida do ritmo
 * da página (globals.css), em vez de um `py` solto — o mesmo utilitário que a
 * chamada principal e o rodapé usam.
 *
 * O empilhamento é 1 / 2 / 4. Duas colunas no telefone deixariam cerca de 150px
 * por card em 360px, largura em que o título e a frase de apoio quebram em quatro
 * linhas cada; a especificação admite uma ou duas "dependendo do espaço", e em
 * 360px não há espaço. A partir de `sm` são duas (2x2 no tablet, como pedido) e de
 * `lg` as quatro em linha.
 *
 * O título continua em `<p>`, e não virou `<h3>`: esta faixa não tem cabeçalho de
 * seção, então um `h3` abaixo do `h1` do Hero abriria um salto de nível no sumário
 * da página. O peso da fonte já é o destaque que o card precisa.
 */
/**
 * Os quatro pilares deixaram de ser quatro caixas.
 *
 * Fechados numa borda completa, eram o primeiro de cinco grelhas de cards
 * idênticos na mesma página, logo abaixo do Hero — a repetição começava na
 * primeira dobra e a faixa competia com a arte do Hero em vez de a prolongar.
 * O mockup aprovado também os mostra sem caixa.
 *
 * Ficou a regra de topo: um fio de 1px com um segmento aceso de 2,5rem no
 * início, que se estende no hover. Separa tanto quanto a caixa separava, com um
 * quarto do peso visual, e a continuação do fio ao longo da linha amarra os
 * quatro como uma faixa só. O segmento aceso é o que distingue esta faixa da
 * regra lisa de "Diferenciais", mais abaixo.
 */
export function Authority() {
  return (
    <section className="hero-pillars">
      <div className="container-shell grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
        {authority.map(([title, description, icon]) => {
          const Icon = ICONS[icon];
          return (
            <div key={title} className="pillar">
              <span className="icon-tile">
                <Icon size={18} aria-hidden="true" />
              </span>
              <p className="mt-4 font-bold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
