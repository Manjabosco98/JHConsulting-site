import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard, type ProjectCardData } from "@/components/projects/ProjectCard";
import { listPublishedProjects } from "@/lib/repositories/public-projects";

/** Projects come from /admin/projetos; see Services.tsx for why there is no bundled fallback. */
async function loadProjects(): Promise<ProjectCardData[]> {
  try {
    const projects = await listPublishedProjects();
    return projects.map((project) => ({
      title: project.title,
      category: project.category,
      problem: project.problem,
      solution: project.solution,
      status: project.status,
      technologies: project.technologies,
      href: `/projetos/${project.slug}`
    }));
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
        <SectionHeading
          kicker="Portfólio"
          title="Projetos e soluções desenvolvidas"
          copy="Os cases são apresentados pelo problema, solução e tecnologias utilizadas, sem expor informações confidenciais de clientes."
        />
        {projects.length ? (
          <>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.title} project={project} />
              ))}
            </div>
            <Link href="/projetos" className="focus-ring mt-10 inline-flex items-center gap-2 font-bold text-blue-300">
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
