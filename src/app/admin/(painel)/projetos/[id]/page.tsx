import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminProject, listProjectSuggestions, listTechnologyOptions } from "@/lib/repositories/projects";
import { formatDateTime } from "@/lib/admin/labels";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProjectForm } from "@/components/admin/projects/ProjectForm";
import { DeleteProjectForm } from "@/components/admin/projects/DeleteProjectForm";
import { CoverImageForm } from "@/components/admin/projects/CoverImageForm";
import { publicImageUrl } from "@/lib/storage/images";
import { saveProjectAction, updateProjectCoverAction } from "../actions";

export const metadata: Metadata = { title: "Editar projeto" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string; erro?: string }> };

export default async function EditProjectPage({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [project, technologies, suggestions] = await Promise.all([
    getAdminProject(supabase, id),
    listTechnologyOptions(supabase),
    listProjectSuggestions(supabase)
  ]);
  if (!project) notFound();

  const published = project.published_at ? ` · publicado em ${formatDateTime(project.published_at)}` : "";

  return (
    <div className="grid gap-6">
      <Link href="/admin/projetos" className="focus-ring inline-flex w-fit items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} aria-hidden="true" /> Projetos
      </Link>
      <AdminPageHeader title={project.title} description={`Atualizado em ${formatDateTime(project.updated_at)}${published}`} />
      {query.criado ? <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Projeto criado como {project.visibility === "published" ? "publicado" : project.visibility === "archived" ? "arquivado" : "rascunho"}.</p> : null}
      {query.erro === "exclusao" ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">Não foi possível excluir o projeto.</p> : null}

      <CoverImageForm
        action={updateProjectCoverAction.bind(null, project.id)}
        currentUrl={publicImageUrl(project.cover_image)}
        title={project.title}
      />

      <ProjectForm
        action={saveProjectAction.bind(null, project.id)}
        isNew={false}
        technologies={technologies}
        suggestions={suggestions}
        initialValues={{
          title: project.title,
          slug: project.slug,
          category: project.category,
          status: project.status,
          short_description: project.short_description,
          description: project.description,
          problem: project.problem,
          solution: project.solution,
          repository_url: project.repository_url ?? "",
          demo_url: project.demo_url ?? "",
          featured: project.featured,
          display_order: String(project.display_order),
          visibility: project.visibility,
          technology_ids: project.technology_ids
        }}
      />

      <section aria-labelledby="zona-de-perigo" className="card grid gap-3 rounded-2xl border-red-400/20 p-5">
        <h2 id="zona-de-perigo" className="font-black">Excluir projeto</h2>
        <p className="text-sm text-slate-400">A exclusão é permanente e remove os vínculos com tecnologias. Para apenas tirar do site, marque como arquivado.</p>
        <DeleteProjectForm id={project.id} title={project.title} />
      </section>
    </div>
  );
}
