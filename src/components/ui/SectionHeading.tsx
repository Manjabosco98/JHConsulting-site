/**
 * Cabeçalho de seção.
 *
 * `kicker` é opcional de propósito. Enquanto era obrigatório, toda seção que
 * usava este componente ganhava um rótulo em caixa alta por construção: a home
 * chegou a treze, um por seção, e o resultado é uma página de ritmo único, em
 * que nenhum cabeçalho se destaca porque todos são iguais. A regra adotada é no
 * máximo um kicker a cada três seções.
 *
 * `as` existe porque nem toda página usa este componente no meio do conteúdo:
 * em /projetos ele é o cabeçalho principal e precisa ser `h1`, não `h2`.
 */
type Props = {
  title: string;
  kicker?: string;
  copy?: string;
  align?: "left" | "center";
  as?: "h1" | "h2";
};

export function SectionHeading({ kicker, title, copy, align = "left", as: Heading = "h2" }: Props) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : ""}>
      {kicker ? <p className="section-kicker">{kicker}</p> : null}
      <Heading className={`section-title ${kicker ? "" : "mt-0"}`}>{title}</Heading>
      {copy ? <p className={`section-copy ${center ? "mx-auto" : ""}`}>{copy}</p> : null}
    </div>
  );
}
