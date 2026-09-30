import { SectionHeading } from "@/components/ui/SectionHeading";
import { listPublicTechnologyGroups } from "@/lib/repositories/public-technologies";

type Group = { key: string; name: string; technologies: readonly string[] };

/** Groups come from /admin/tecnologias; see Services.tsx for why there is no bundled fallback. */
async function loadGroups(): Promise<Group[]> {
  try {
    const groups = await listPublicTechnologyGroups();
    return groups
      .filter((group) => group.technologies.length)
      .map((group) => ({ key: group.id, name: group.name, technologies: group.technologies }));
  } catch (error) {
    console.error(`[home] tecnologias indisponíveis: ${(error as Error).message}`);
    return [];
  }
}

export async function Technologies() {
  const groups = await loadGroups();
  return (
    <section id="tecnologias" className="section-space">
      <div className="container-shell">
        <SectionHeading
          title="Ferramentas escolhidas conforme o problema"
          copy="A stack é um meio para chegar ao resultado: segurança, manutenção, integração e capacidade de evolução."
        />
        {groups.length ? (
          /*
           * Grade com alinhamento ao topo, não fluxo em colunas.
           *
           * Aqui havia `columns-3`, escolhido para que cada grupo ocupasse só a
           * altura que tem, sem a altura igual que uma grade impõe à linha. O
           * efeito medido no navegador foi outro: com sete grupos, o balanceador
           * do Chrome distribui 3/3/1, e a terceira coluna fica com um grupo e
           * uns 250px de vazio embaixo — exatamente a área morta que o fluxo em
           * colunas deveria evitar.
           *
           * `items-start` resolve o problema original sem o efeito colateral: os
           * grupos mantêm a altura natural (a linha não estica ninguém) e a
           * distribuição passa a ser previsível, três por linha da esquerda para
           * a direita. Sobra no máximo o fim da última linha, que lê como linha
           * incompleta e não como coluna abandonada.
           *
           * Sem card: o que agrupa é o título mais o espaço. Caixa aqui seria
           * moldura em volta de uma lista de palavras.
           */
          <div className="mt-12 grid items-start gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.key}>
                <h3 className="font-bold">{group.name}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.technologies.map((technology) => (
                    <span key={technology} className="rounded-full bg-white/5 px-2.5 py-1.5 text-xs text-slate-300">{technology}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-12 text-slate-400">Tecnologias serão publicadas em breve.</p>
        )}
      </div>
    </section>
  );
}
