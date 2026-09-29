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
 */

const SPAN_CLASS = {
  2: "md:col-span-2",
  3: "md:col-span-3",
  6: "md:col-span-6"
} as const;

type Span = keyof typeof SPAN_CLASS;

function spanPlan(count: number): Span[] {
  const rest = count % 3;
  const narrow = (n: number): Span[] => Array.from({ length: Math.max(n, 0) }, () => 2);
  if (rest === 1) return [6, ...narrow(count - 1)];
  if (rest === 2) return [3, 3, ...narrow(count - 2)];
  return narrow(count);
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

export function ProjectGrid({ projects }: { projects: PublicProjectSummary[] }) {
  const ordered = featuredFirst(projects);
  const plan = spanPlan(ordered.length);

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
      {ordered.map((project, index) => {
        const span = plan[index];
        return (
          <div key={project.id} className={SPAN_CLASS[span]}>
            <ProjectCard
              layout={span === 6 ? "wide" : "stacked"}
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
