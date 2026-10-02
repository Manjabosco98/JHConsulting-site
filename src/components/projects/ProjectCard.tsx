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

/** `wide` ocupa a linha inteira da grade, com capa maior, texto maior e mais recuo. */
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
export function ProjectCard({ project, layout = "stacked", imageSizes, headingLevel = "h3" }: { project: ProjectCardData; layout?: ProjectCardLayout; imageSizes: string; headingLevel?: "h2" | "h3" }) {
  const wide = layout === "wide";
  const Heading = headingLevel;

  /*
   * A capa aparece inteira, e este bloco existe para garantir isso.
   *
   * Duas coisas estavam erradas aqui, e a primeira era uma suposição: o comentário
   * anterior afirmava que as capas sao enviadas em 1200x630. Nada valida isso. Não
   * há checagem de dimensão no upload (`src/lib/storage/images.ts`), e a capa real
   * publicada mede 2:1 exatos, não 1,905. Medido no navegador: a moldura de
   * 1200/630 com `object-cover` já cortava 4,8% da largura da imagem.
   *
   * A segunda era o `xl:aspect-auto` do formato largo. Ali a capa dividia a linha
   * com o texto e esticava para acompanhar a altura dele, o que em 1280px punha
   * uma imagem 2:1 numa caixa de 1,327 e comia 33,7% da largura — um terço do
   * conteúdo visual do case, que é justamente o que o card existe para mostrar.
   *
   * As duas correções:
   *
   * 1. `object-contain` no lugar de `object-cover`. Como a proporção da capa não é
   *    garantida, preencher significa cortar uma quantidade desconhecida de cada
   *    imagem nova. Contendo, o desvio aparece como faixa da própria superfície do
   *    card em vez de conteúdo perdido, que é o modo de falhar correto para a peça
   *    de um portfólio. Com isso o valor exato da moldura deixa de ser crítico:
   *    2/1 é o centro entre a capa real (2,0) e a medida social de 1200x630
   *    (1,905), e nessa faixa a faixa lateral fica em 2,4% de cada lado.
   *
   * 2. A capa do card largo deixou de dividir a linha com o texto e passou a ficar
   *    em cima, na largura inteira do card. Não foi preferência: com uma capa 2:1 ao
   *    lado desta quantidade de texto, nenhuma divisão de colunas fecha. Medindo de
   *    620px a 850px de coluna de imagem, a conta sempre termina em recorte de 25%
   *    a 34% (preenchendo) ou num vão de 70px a 130px (contendo), porque o bloco de
   *    texto não desce de ~400px de altura. Em cima e na largura inteira, a capa
   *    aparece completa e não sobra vão nenhum.
   */
  const cover = project.coverUrl ? (
    <div className="relative aspect-[2/1] overflow-hidden border-b border-blue-400/10 bg-[#080f1d]">
      <Image
        src={project.coverUrl}
        alt={`Capa do projeto ${project.title}`}
        fill
        // A grade conhece o span real em cada breakpoint e informa o tamanho
        // correspondente, inclusive quando dois projetos ocupam meia linha.
        sizes={imageSizes}
        className="object-contain"
      />
    </div>
  ) : null;

  const body = (
    /* `p-5` no telefone: em 320px o card tem 280px e 24px de recuo de cada lado
     * deixavam 232px de medida para título, descrição e chips. */
    <div className={`flex flex-1 flex-col ${wide ? "p-6 sm:p-8" : "p-5 sm:p-6"}`}>
      {/* `min-w-0` no bloco de texto: num item de flex o tamanho mínimo é o
        * conteúdo mínimo, então uma categoria ou um título com palavra longa
        * empurraria a seta para fora do card em vez de quebrar a linha. */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {project.category ? (
            <p className="inline-flex max-w-full rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold leading-5 text-blue-200">
              {project.category}
            </p>
          ) : null}
          <Heading className={`mt-4 font-bold leading-snug tracking-[-.025em] ${wide ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"}`}>{project.title}</Heading>
        </div>
        <ArrowUpRight className="shrink-0 text-slate-500 transition-colors group-hover:text-blue-300" aria-hidden="true" />
      </div>

      {project.shortDescription ? (
        <p className={`mt-4 leading-7 text-slate-300 ${wide ? "max-w-[60ch] text-base" : "text-sm sm:text-base"}`}>{project.shortDescription}</p>
      ) : null}

      {project.technologies.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <span key={tech} className="rounded-full border border-blue-400/15 bg-blue-500/5 px-2.5 py-1 text-xs text-blue-200/85">{tech}</span>
          ))}
        </div>
      ) : null}

      {/* Antes em verde-esmeralda, que era um segundo acento fora do sistema
        * azul/ciano. O status é informação, não alerta. */}
      {project.status ? <p className="mt-auto pt-6 text-xs font-semibold text-blue-200/80">{project.status}</p> : null}
    </div>
  );

  /*
   * Capa em cima, texto embaixo, nos dois formatos. O `wide` tinha um
   * `grid xl:grid-cols-2` aqui, que é de onde vinha o recorte de 33,7%: a célula
   * da capa herdava a altura da coluna de texto. A diferença entre os formatos
   * passou a ser só largura, escala do texto e recuo, que é o suficiente para o
   * card de destaque quebrar a repetição da grade.
   */
  const inner = (
    <>
      {cover}
      {body}
    </>
  );

  const shell = `card group flex h-full flex-col overflow-hidden rounded-2xl border-blue-400/15! transition-[border-color,box-shadow,transform] duration-300 ${project.href ? "hover:-translate-y-1 hover:border-blue-400/35! hover:shadow-[0_18px_40px_-30px_rgba(37,99,235,0.45)]!" : ""}`;

  if (project.href) {
    return (
      <Link href={`${project.href}#inicio-projeto`} aria-label={`Ver projeto ${project.title}`} className={`focus-ring ${shell}`}>
        {inner}
      </Link>
    );
  }
  return <article className={shell}>{inner}</article>;
}
