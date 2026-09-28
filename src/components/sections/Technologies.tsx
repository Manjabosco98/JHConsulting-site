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
          kicker="Tecnologias"
          title="Ferramentas escolhidas conforme o problema"
          copy="A stack é um meio para chegar ao resultado: segurança, manutenção, integração e capacidade de evolução."
        />
        {groups.length ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((group) => (
              <div key={group.key} className="card rounded-2xl p-5">
                <h3 className="font-bold">{group.name}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.technologies.map((technology) => (
                    <span key={technology} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300">{technology}</span>
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
