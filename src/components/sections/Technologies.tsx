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
           * Fluxo em múltiplas colunas (`columns-*`), não grade.
           *
           * São sete grupos, cada um com uma quantidade diferente de chips. Numa
           * grade de três colunas sobram duas células vazias na última linha, e a
           * altura igual das linhas obriga o grupo de duas tecnologias a ocupar o
           * mesmo espaço do de dez. O fluxo em colunas resolve os dois: encaixa
           * qualquer quantidade sem lacuna e cada grupo ocupa só a altura que tem.
           *
           * Sem card também: o que agrupa é o título mais o espaço. Caixa aqui
           * seria moldura em volta de uma lista de palavras.
           */
          <div className="mt-12 columns-1 gap-10 sm:columns-2 lg:columns-3">
            {groups.map((group) => (
              <div key={group.key} className="mb-10 break-inside-avoid">
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
