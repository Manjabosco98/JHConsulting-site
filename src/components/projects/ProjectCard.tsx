import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export type ProjectCardData = {
  title: string;
  category: string;
  shortDescription: string;
  status: string;
  coverUrl: string | null;
  technologies: readonly string[];
  href: string | null;
};

/** `wide` ocupa a linha inteira e vira duas colunas: capa à esquerda, texto à direita. */
export type ProjectCardLayout = "stacked" | "wide";

/**
 * Card do portfólio.
 *
 * Duas mudanças de fundo em relação à versão anterior:
 *
 * 1. A capa aparece. `listPublishedProjects` já trazia `coverUrl` do banco, o
 *    painel já tem upload e o `next/image` já estava configurado, mas o card
 *    ignorava o campo: a imagem só existia na página de detalhe. O portfólio era
 *    uma grade de texto num site que tem as fotos prontas.
 * 2. `shortDescription` substitui os blocos rotulados "Problema" e "Solução".
 *    Esse campo também vinha do banco sem nunca ser exibido. Problema e solução
 *    continuam na página do projeto, onde há espaço para os dois; no card eles
 *    empilhavam quatro parágrafos e faziam a grade parecer um formulário.
 */
export function ProjectCard({ project, layout = "stacked" }: { project: ProjectCardData; layout?: ProjectCardLayout }) {
  const wide = layout === "wide";

  const cover = project.coverUrl ? (
    <div
      className={
        wide
          ? "relative aspect-[16/10] lg:aspect-auto lg:min-h-[21rem]"
          : "relative aspect-[1200/630] border-b border-white/8"
      }
    >
      <Image
        src={project.coverUrl}
        alt={`Capa do projeto ${project.title}`}
        fill
        sizes={wide ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
        className="object-cover"
      />
    </div>
  ) : null;

  const body = (
    <div className={wide ? "p-6 sm:p-8" : "p-6"}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-blue-300">{project.category}</p>
          <h3 className={`mt-3 font-bold tracking-[-.02em] ${wide ? "text-2xl sm:text-3xl" : "text-xl"}`}>{project.title}</h3>
        </div>
        <ArrowUpRight className="shrink-0 text-slate-500 transition-colors group-hover:text-blue-300" aria-hidden="true" />
      </div>

      {project.shortDescription ? (
        <p className={`mt-4 leading-7 text-slate-400 ${wide ? "max-w-[52ch] text-base" : "text-sm"}`}>{project.shortDescription}</p>
      ) : null}

      {project.technologies.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <span key={tech} className="rounded-full border border-white/8 px-2.5 py-1 text-xs text-slate-400">{tech}</span>
          ))}
        </div>
      ) : null}

      {/* Antes em verde-esmeralda, que era um segundo acento fora do sistema
        * azul/ciano. O status é informação, não alerta. */}
      {project.status ? <p className="mt-6 text-xs font-bold text-blue-200/80">{project.status}</p> : null}
    </div>
  );

  const inner = wide ? (
    <div className="grid lg:grid-cols-2">
      {cover}
      <div className="flex flex-col justify-center">{body}</div>
    </div>
  ) : (
    <>
      {cover}
      {body}
    </>
  );

  const shell = `card group h-full overflow-hidden rounded-2xl transition-colors ${project.href ? "hover:border-blue-400/30" : ""}`;

  if (project.href) {
    return (
      <Link href={project.href} className={`focus-ring block ${shell}`}>
        {inner}
      </Link>
    );
  }
  return <article className={shell}>{inner}</article>;
}
