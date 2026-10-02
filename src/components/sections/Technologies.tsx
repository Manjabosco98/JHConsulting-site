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
    <section id="tecnologias" className="section-space border-t border-white/5">
      <div className="container-shell">
        <SectionHeading
          title="Ferramentas escolhidas conforme o problema"
          copy="A stack é um meio para chegar ao resultado: segurança, manutenção, integração e capacidade de evolução."
        />
        {groups.length ? (
          <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {groups.map((group) => (
              <article key={group.key} className="min-w-0 border-t border-blue-400/20 pt-5">
                <h3 className="text-base font-bold">{group.name}</h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.technologies.map((technology) => (
                    <li key={technology} className="rounded-md bg-blue-500/7 px-2.5 py-1.5 text-xs text-blue-100/90">{technology}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-12 text-slate-400">Tecnologias serão publicadas em breve.</p>
        )}
      </div>
    </section>
  );
}
