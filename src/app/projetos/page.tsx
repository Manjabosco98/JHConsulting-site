import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { listPublishedProjects } from "@/lib/repositories/public-projects";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projetos",
  description: "Cases de automação, desenvolvimento de sistemas, APIs, integrações e dados desenvolvidos pela JHConsulting.",
  alternates: { canonical: "/projetos" },
  openGraph: {
    type: "website",
    url: "/projetos",
    title: "Projetos | JHConsulting",
    description: "Cases de automação, sistemas, APIs, integrações e dados."
  }
};

export default async function ProjetosPage() {
  const [projects, settings] = await Promise.all([listPublishedProjects(), getSiteSettings()]);
  return (
    <>
      <Navbar internal whatsappUrl={whatsappLink(settings.whatsapp)} />
      <main className="section-space">
        <div className="container-shell">
          <SectionHeading
            kicker="Portfólio"
            title="Projetos e soluções desenvolvidas"
            copy="Cada case é apresentado pelo problema enfrentado, a solução construída e as tecnologias utilizadas."
          />
          {projects.length ? (
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={{
                    title: project.title,
                    category: project.category,
                    problem: project.problem,
                    solution: project.solution,
                    status: project.status,
                    technologies: project.technologies,
                    href: `/projetos/${project.slug}`
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="mt-12 text-slate-400">Novos projetos serão publicados em breve.</p>
          )}
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
