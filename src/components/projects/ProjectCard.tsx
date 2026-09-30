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

  /*
   * Uma proporção só para os dois formatos, e é a da imagem: as capas são
   * enviadas em 1200x630 (a medida de imagem de compartilhamento), então 1200/630
   * mostra o arquivo inteiro sem recorte nenhum. O `wide` usava 16/10, que é mais
   * alto, e o `object-cover` cortava as laterais da capa para preencher — duas
   * proporções para o mesmo ativo, e uma delas comendo a borda da imagem.
   *
   * A exceção é `xl:aspect-auto` no formato largo: ali a capa divide a linha com
   * o texto e precisa acompanhar a altura da coluna vizinha, o que só se resolve
   * preenchendo. É o único lugar onde o recorte é inevitável, e é intencional.
   *
   * A divisão em duas colunas começa em `xl` (1280px), e não em `lg` (1024px),
   * por causa desse preenchimento. Em 1024px a coluna de texto media 586px de
   * altura para 473px de largura, então a capa era esticada para 473x586 — uma
   * paisagem de 1200x630 recortada em retrato, perdendo mais da metade da
   * largura da imagem. De 1280px para cima a mesma célula fica em 589x444, um
   * recorte suave que a capa suporta. Abaixo disso o card largo empilha capa e
   * texto, e a capa aparece inteira.
   */
  const cover = project.coverUrl ? (
    <div
      className={
        wide
          ? "relative aspect-[1200/630] xl:aspect-auto xl:min-h-[21rem]"
          : "relative aspect-[1200/630] border-b border-white/8"
      }
    >
      <Image
        src={project.coverUrl}
        alt={`Capa do projeto ${project.title}`}
        fill
        sizes={wide ? "(min-width: 1280px) 50vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"}
        className="object-cover"
      />
    </div>
  ) : null;

  const body = (
    /* `p-5` no telefone: em 320px o card tem 280px e 24px de recuo de cada lado
     * deixavam 232px de medida para título, descrição e chips. */
    <div className={wide ? "p-6 sm:p-8" : "p-5 sm:p-6"}>
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
    <div className="grid xl:grid-cols-2">
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
