import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Github } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { whatsappHref } from "@/constants/site";
import { getPublishedProjectBySlug, listPublishedProjectSlugs } from "@/lib/repositories/public-projects";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await listPublishedProjectSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) return { title: "Projeto não encontrado", robots: { index: false, follow: false } };

  const description = (project.shortDescription || project.problem || project.solution).slice(0, 200) || undefined;
  const images = project.coverUrl ? [project.coverUrl] : undefined;
  return {
    title: project.title,
    description,
    alternates: { canonical: `/projetos/${project.slug}` },
    openGraph: { type: "article", url: `/projetos/${project.slug}`, title: project.title, description, images },
    twitter: { card: "summary_large_image", title: project.title, description, images }
  };
}

function paragraphs(text: string) {
  return text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
}

export default async function ProjetoDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getPublishedProjectBySlug(slug);
  if (!project) notFound();

  const description = paragraphs(project.description);
  const message = `Olá João, vi o projeto ${project.title} no site da JHConsulting e gostaria de conversar sobre um projeto parecido.`;

  return (
    <>
      <Navbar internal />
      <main className="section-space">
        <article className="container-shell max-w-4xl">
          <Link href="/projetos" className="focus-ring inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition hover:text-slate-200">
            <ArrowLeft size={15} aria-hidden="true" /> Todos os projetos
          </Link>

          <header className="mt-6">
            <p className="section-kicker">{project.category}</p>
            <h1 className="section-title">{project.title}</h1>
            {project.status ? <p className="mt-4 text-sm font-bold text-emerald-300">{project.status}</p> : null}
          </header>

          {project.coverUrl ? (
            <div className="relative mt-8 aspect-[1200/630] overflow-hidden rounded-3xl border border-white/10">
              <Image src={project.coverUrl} alt={`Capa do projeto ${project.title}`} fill priority sizes="(min-width: 896px) 896px, 100vw" className="object-cover" />
            </div>
          ) : null}

          {project.technologies.length ? (
            <div className="mt-8 flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span key={tech} className="rounded-full border border-white/8 px-3 py-1 text-xs text-slate-300">{tech}</span>
              ))}
            </div>
          ) : null}

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            {project.problem ? (
              <section>
                <h2 className="font-black">Problema</h2>
                <p className="mt-2 leading-8 text-slate-300">{project.problem}</p>
              </section>
            ) : null}
            {project.solution ? (
              <section>
                <h2 className="font-black">Solução</h2>
                <p className="mt-2 leading-8 text-slate-300">{project.solution}</p>
              </section>
            ) : null}
          </div>

          {description.length ? (
            <section className="mt-10">
              <h2 className="font-black">Sobre o projeto</h2>
              <div className="mt-3 space-y-4 leading-8 text-slate-300">
                {description.map((block, index) => <p key={index}>{block}</p>)}
              </div>
            </section>
          ) : null}

          {(project.repositoryUrl || project.demoUrl) ? (
            <div className="mt-10 flex flex-wrap gap-3">
              {project.demoUrl ? (
                <a href={project.demoUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold hover:bg-blue-500">
                  Ver demonstração <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              ) : null}
              {project.repositoryUrl ? (
                <a href={project.repositoryUrl} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5">
                  <Github size={16} aria-hidden="true" /> Repositório
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="card mt-14 rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-black">Tem um desafio parecido?</h2>
            <p className="mt-2 text-slate-400">Conte o processo que você quer melhorar e receba um diagnóstico inicial.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/#contato" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold hover:bg-blue-500">Falar sobre um projeto</Link>
              <a href={whatsappHref(message)} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5">WhatsApp</a>
            </div>
          </div>
        </article>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
