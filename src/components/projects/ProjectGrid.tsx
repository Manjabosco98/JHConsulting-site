import { ProjectCard } from "@/components/projects/ProjectCard";
import type { PublicProjectSummary } from "@/lib/repositories/public-projects";

/**
 * Grade do portfólio, usada na home e em /projetos, que antes mantinham duas
 * cópias do mesmo `lg:grid-cols-3`.
 *
 * O problema desse grid fixo era a contagem: com um projeto publicado, o único
 * card ficava estreito ao lado de duas células vazias. Uma grade tem exatamente
 * tantas células quanto há conteúdo; quando sobra buraco, a grade está errada,
 * não o conteúdo.
 *
 * A solução é uma base de 6 colunas e spans escolhidos pelo resto da divisão por
 * 3, o que preenche qualquer quantidade sem deixar lacuna:
 *
 *   resto 0 (3, 6, 9)  → tudo em 2 (linhas de três)
 *   resto 1 (1, 4, 7)  → o primeiro em 6, largo, o resto em 2
 *   resto 2 (2, 5, 8)  → os dois primeiros em 3, o resto em 2
 *
 * Como efeito colateral desejado, a página ganha ritmo: a linha larga quebra a
 * repetição de cards iguais que se repetia em seis seções da home.
 *
 * ── O degrau que faltava no tablet ───────────────────────────────────────────
 *
 * Esse plano valia a partir de `md`, e ali a grade pulava de uma para três
 * colunas: em 768px um card de três por linha fica com cerca de 236px, e a capa
 * dentro dele com 124px de altura — ilegível para a imagem que carrega o case.
 *
 * Então existem dois planos, um por faixa. De `lg` para cima, o de 1/2/3 colunas
 * descrito acima. Em `md`, duas colunas, que é a largura confortável (~374px)
 * para um card com capa, título, descrição e chips.
 *
 * Duas colunas trazem de volta o risco da célula vazia, e a regra continua
 * valendo: quando a quantidade de cards estreitos é ímpar, o último ocupa a
 * linha inteira em vez de deixar metade de linha em branco. Verificado de 1 a 7
 * projetos em `tests/project-grid.test.mjs`.
 */

/*
 * As quatro combinações que o plano produz, na forma `md-lg`, sobre a base de 6
 * colunas: 2 é um terço da linha, 3 é metade, 6 é a linha inteira.
 *
 * A chave é o par de spans e o valor é a classe, para que nenhuma combinação
 * exista sem CSS correspondente: `spanPlan` devolve `keyof typeof SPAN_CLASS`,
 * então uma combinação nova não compila enquanto não for declarada aqui.
 */
const SPAN_CLASS = {
  // Metade no tablet, um terço no desktop: o card estreito comum.
  "3-2": "md:col-span-3 lg:col-span-2",
  // Estreito ímpar sobrando: linha inteira no tablet para não deixar meia linha
  // em branco, e um terço no desktop, onde o plano de três fecha exato.
  "6-2": "md:col-span-6 lg:col-span-2",
  // Metade nas duas faixas: o par que abre a contagem de resto 2.
  "3-3": "md:col-span-3",
  // Linha inteira nas duas faixas: o card largo de abertura.
  "6-6": "md:col-span-6"
} as const;

/** Tamanho da capa para o span real, evitando ampliar uma imagem de 1/3 em cards de 1/2 linha. */
const IMAGE_SIZES = {
  "3-2": "(min-width: 1024px) min(33vw, 380px), (min-width: 768px) 50vw, 100vw",
  "6-2": "(min-width: 1024px) min(33vw, 380px), (min-width: 768px) 100vw, 100vw",
  "3-3": "(min-width: 768px) min(50vw, 580px), 100vw",
  "6-6": "(min-width: 1280px) 1180px, 100vw"
} satisfies Record<keyof typeof SPAN_CLASS, string>;

/** `${spanMd}-${spanLg}`. O span de `lg` decide também o formato do card. */
type PlanKey = keyof typeof SPAN_CLASS;

/** Exportado para o teste, que confere se cada linha fecha em 6 nas duas faixas. */
export function spanPlan(count: number): PlanKey[] {
  if (count <= 0) return [];
  const rest = count % 3;
  const lead: PlanKey[] = rest === 1 ? ["6-6"] : rest === 2 ? ["3-3", "3-3"] : [];
  const narrowCount = count - lead.length;

  // Em `md` os estreitos vão de dois em dois; o último ímpar abre para a linha
  // inteira, para que nenhuma linha termine com metade vazia.
  const narrow: PlanKey[] = Array.from({ length: narrowCount }, (_, index) =>
    index === narrowCount - 1 && narrowCount % 2 === 1 ? "6-2" : "3-2"
  );

  return [...lead, ...narrow];
}

/**
 * Projetos marcados como destaque no painel vão para a frente, preservando a
 * ordem relativa de `display_order`. Antes deste componente, `featured` era
 * lido do banco e nunca usado em lugar nenhum: marcar o destaque não mudava
 * nada na página. Agora define quem fica na posição larga.
 */
function featuredFirst(projects: PublicProjectSummary[]): PublicProjectSummary[] {
  return [...projects.filter((project) => project.featured), ...projects.filter((project) => !project.featured)];
}

export function ProjectGrid({ projects, headingLevel = "h3" }: { projects: PublicProjectSummary[]; headingLevel?: "h2" | "h3" }) {
  const ordered = featuredFirst(projects);
  const plan = spanPlan(ordered.length);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
      {ordered.map((project, index) => {
        const key = plan[index];
        return (
          <div key={project.id} className={SPAN_CLASS[key]}>
            <ProjectCard
              // Só o card que ocupa a linha inteira no desktop ganha o formato
              // de duas colunas; `6-2` é largo apenas no tablet.
              layout={key === "6-6" ? "wide" : "stacked"}
              imageSizes={IMAGE_SIZES[key]}
              headingLevel={headingLevel}
              project={{
                title: project.title,
                category: project.category,
                shortDescription: project.shortDescription,
                status: project.status,
                coverUrl: project.coverUrl,
                technologies: project.technologies,
                href: `/projetos/${project.slug}`
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
