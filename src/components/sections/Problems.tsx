import { ArrowRight, Copy, EyeOff, FileDown, Globe, Table2, Unplug, type LucideIcon } from "lucide-react";
import { problems } from "@/constants/content";

/**
 * `satisfies` e não anotação de tipo, igual a `Authority.tsx`: assim as chaves
 * continuam sendo os seis literais, e `ICONS[icon]` só compila enquanto todo
 * nome declarado em `content.ts` existir aqui. Se um dos dois lados mudar sem o
 * outro, o erro aparece no build e não como ícone faltando na página.
 */
const ICONS = { Copy, Table2, FileDown, Globe, Unplug, EyeOff } satisfies Record<string, LucideIcon>;

/**
 * A seção de dor: o visitante precisa reconhecer a própria operação aqui antes
 * de a página falar de solução.
 *
 * O split continua 45/55 (`9fr_11fr`), e não os 40/60 que a especificação da
 * fase sugere, porque a troca foi medida no navegador a 1440px e os 40/60 são
 * estritamente piores aqui:
 *
 *   40/60  coluna de 453px  título em 5 linhas  cards 2-2-2-2-1-2  seção 612px
 *   45/55  coluna de 509px  título em 4 linhas  cards 2-2-2-2-1-2  seção 568px
 *
 * Os 5% a mais na direita alargam o card de 305px para 334px e não economizam
 * uma única linha — a quebra dos seis cards é idêntica nos dois. O que eles
 * custam é uma quinta linha no título mais longo da página (75 caracteres) e
 * 44px de altura, contra a densidade que a própria especificação pede. O teto
 * de 2.5rem de `.section-title` foi dimensionado em globals.css justamente
 * contra a largura desta coluna; estreitá-la desfaz essa conta.
 *
 * Duas colunas de card, e não três. Em 1440px a coluna da direita mede ~620px,
 * o que dá ~305px por card em duas colunas e ~200px em três; as frases têm até
 * 50 caracteres e em 200px quebram em três linhas, o que deixaria os cards
 * desalinhados em altura e a faixa mais alta — o oposto do que a seção pede.
 */
export function Problems() {
  return (
    <section className="section-space">
      <div className="container-shell grid gap-12 lg:grid-cols-[9fr_11fr]">
        <div>
          {/*
            * Pílula, e não `.section-kicker`.
            *
            * O kicker em caixa alta foi removido daqui numa fase anterior, e o
            * orçamento de rótulos registrado em globals.css conta quatro na home
            * (pílula do Hero, Serviços, Soluções e Contato). Esta é a quinta
            * marca, pedida pela especificação da fase: ela reusa exatamente as
            * classes da pílula do Hero, para não criar um sexto estilo de
            * rótulo, e vem sem ícone — a do Hero tem um, e repetir o par
            * ícone+texto daria a esta o mesmo peso do topo da página, enquanto
            * aqui ela precisa pesar menos que o título.
            */}
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/7 px-3 py-1.5 text-xs font-bold text-blue-200">
            Problemas que a tecnologia pode resolver
          </p>
          {/* Sem `mt-0`: agora existe a pílula acima, e o respiro padrão de
            * `.section-title` é o mesmo que o `SectionHeading` aplica quando tem
            * kicker. */}
          <h2 className="section-title">Sua empresa ainda perde tempo com processos que poderiam ser automatizados?</h2>
          <p className="section-copy">
            Muitas empresas ainda dependem de processos manuais, repetitivos e suscetíveis a erros. Com automação e integração,
            essas atividades podem ser simplificadas, reduzindo retrabalho e liberando tempo da equipe para tarefas mais estratégicas.
          </p>
          <a href="#contato" className="link-arrow focus-ring mt-8 inline-flex items-center gap-2 font-bold text-blue-300">
            Quero analisar meu processo <ArrowRight className="link-arrow-icon" size={18} aria-hidden="true" />
          </a>
        </div>
        {/*
          * `ul`/`li` e não seis `div`, e sem `h3` em cada card.
          *
          * São seis itens irmãos sem conteúdo próprio embaixo: a lista faz o
          * leitor de tela anunciar "lista de 6 itens", que é a informação útil
          * aqui, enquanto seis `h3` sem corpo encheriam o sumário da página de
          * cabeçalhos vazios entre o `h2` desta seção e o da próxima.
          */}
        <ul className="grid gap-3 sm:grid-cols-2">
          {problems.map(([problem, icon]) => {
            const Icon = ICONS[icon];
            return (
              /* Hover só na borda, como nos pilares: estes cards não são
               * clicáveis, e elevar ou deslocar sugeriria um destino que não
               * existe. */
              <li key={problem} className="card flex items-start gap-3 rounded-2xl p-4 transition-colors hover:border-blue-400/30">
                {/* Mesmo recipiente dos pilares, um degrau menor: 36px com
                  * traço de 16px, porque aqui o card tem `p-4` e uma linha de
                  * texto, e os 40px dos pilares dominariam o rótulo. */}
                <span className="icon-tile icon-tile-sm">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <p className="min-w-0 text-sm font-semibold leading-6 text-slate-200">{problem}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
