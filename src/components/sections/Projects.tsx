import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { listPublishedProjects, type PublicProjectSummary } from "@/lib/repositories/public-projects";

/** Projects come from /admin/projetos; see Services.tsx for why there is no bundled fallback. */
async function loadProjects(): Promise<PublicProjectSummary[]> {
  try {
    return await listPublishedProjects();
  } catch (error) {
    console.error(`[home] projetos indisponíveis: ${(error as Error).message}`);
    return [];
  }
}

export async function Projects() {
  const projects = await loadProjects();
  return (
    <section id="projetos" className="section-space">
      <div className="container-shell">
        {/* Sem kicker: o título já diz "Projetos", e a página inteira tinha um
          * rótulo em caixa alta por seção. */}
        <SectionHeading
          title="Projetos e soluções desenvolvidas"
          copy="Os cases são apresentados pelo problema, solução e tecnologias utilizadas, sem expor informações confidenciais de clientes."
        />
        {projects.length ? (
          <>
            <div className="mt-12">
              <ProjectGrid projects={projects} />
            </div>
            <Link href="/projetos" className="focus-ring mt-10 inline-flex items-center gap-2 font-bold text-blue-300 transition hover:text-blue-200">
              Ver todos os projetos <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </>
        ) : (
          <p className="mt-12 text-slate-400">Novos projetos serão publicados em breve.</p>
        )}
      </div>
    </section>
  );
}
