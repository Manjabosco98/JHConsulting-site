import { authority } from "@/constants/content";

/**
 * Faixa de quatro afirmações logo abaixo do Hero.
 *
 * Os fios que separam as células eram só `md:border-r`, isto é, só existiam a
 * partir de 768px. No telefone, onde a faixa vira quatro blocos empilhados, não
 * havia separação nenhuma: quatro pares de título e frase curta corridos, sem
 * nada indicando onde um termina e o outro começa. Abaixo de `md` a divisão passa
 * a ser horizontal (`border-t`, menos o primeiro) e nas telas maiores volta a ser
 * vertical, que é a leitura correta em cada direção de empilhamento.
 *
 * O recuo lateral também é só de `md` para cima: no telefone o `px-5` somava aos
 * 20px do container e empurrava o texto para 40px da borda, desalinhado de todas
 * as outras seções da página.
 */
export function Authority() {
  return (
    <section className="border-b border-white/5">
      <div className="container-shell grid md:grid-cols-4">
        {authority.map(([title, description]) => (
          <div
            key={title}
            className="border-t border-white/8 py-6 first:border-t-0 md:border-t-0 md:border-r md:px-5 md:py-7 md:first:border-l"
          >
            <p className="font-bold">{title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
