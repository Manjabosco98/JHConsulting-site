import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { DEFAULT_OG_IMAGE } from "@/lib/seo/og";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProjectGrid } from "@/components/projects/ProjectGrid";
import { listPublishedProjects } from "@/lib/repositories/public-projects";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { companyName } = await getSiteSettings();
  const description = `Cases de automação, desenvolvimento de sistemas, APIs, integrações e dados desenvolvidos pela ${companyName}.`;
  return {
    title: "Projetos",
    description,
    alternates: { canonical: "/projetos" },
    openGraph: { type: "website", url: "/projetos", title: `Projetos | ${companyName}`, description, images: [DEFAULT_OG_IMAGE] }
  };
}

export default async function ProjetosPage() {
  const [projects, settings] = await Promise.all([listPublishedProjects(), getSiteSettings()]);
  return (
    <>
      <Navbar internal whatsappUrl={whatsappLink(settings.whatsapp)} />
      <main className="section-space">
        <div className="container-shell">
          {/* `as="h1"`: aqui o cabeçalho é o título da página. Enquanto o
            * SectionHeading só emitia `h2`, esta rota não tinha nenhum `h1`. */}
          <SectionHeading
            as="h1"
            title="Projetos e soluções desenvolvidas"
            copy="Cada case é apresentado pelo problema enfrentado, a solução construída e as tecnologias utilizadas."
          />
          {projects.length ? (
            <div className="mt-12">
              <ProjectGrid projects={projects} />
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
