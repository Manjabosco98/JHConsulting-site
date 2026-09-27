import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, Star } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { countProjectsByFilter, listAdminProjects, projectFilters, type ProjectFilter } from "@/lib/repositories/projects";
import { formatDateTime } from "@/lib/admin/labels";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import type { ProjectVisibility } from "@/lib/validation/project";

export const metadata: Metadata = { title: "Projetos" };

const filterLabels: Record<ProjectFilter, string> = {
  todos: "Todos",
  publicados: "Publicados",
  rascunhos: "Rascunhos",
  arquivados: "Arquivados"
};

const visibilityBadge: Record<ProjectVisibility, { label: string; className: string }> = {
  published: { label: "Publicado", className: "border-emerald-400/30 text-emerald-300" },
  draft: { label: "Rascunho", className: "border-amber-400/30 text-amber-300" },
  archived: { label: "Arquivado", className: "border-white/10 text-slate-400" }
};

type SearchParams = Promise<{ filtro?: string; q?: string; excluido?: string }>;

export default async function AdminProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const filter = projectFilters.includes(params.filtro as ProjectFilter) ? (params.filtro as ProjectFilter) : "todos";
  const search = (params.q ?? "").trim().slice(0, 100);

  const supabase = await createClient();
  const [projects, counts] = await Promise.all([
    listAdminProjects(supabase, { filter, search }),
    countProjectsByFilter(supabase)
  ]);

  const href = (next: ProjectFilter) => {
    const query = new URLSearchParams();
    if (next !== "todos") query.set("filtro", next);
    if (search) query.set("q", search);
    const qs = query.toString();
    return qs ? `/admin/projetos?${qs}` : "/admin/projetos";
  };

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Projetos"
        description="Cadastre, edite, publique e ordene os projetos do portfólio."
        actions={
          <div className="text-sm font-bold">
            <Link href="/admin/projetos/novo" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 hover:bg-blue-500">
              <Plus size={16} aria-hidden="true" /> Novo projeto
            </Link>
          </div>
        }
      />

      {params.excluido ? <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Projeto excluído.</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav aria-label="Filtrar projetos" className="flex flex-wrap gap-1">
          {projectFilters.map((option) => (
            <Link key={option} href={href(option)} aria-current={option === filter ? "page" : undefined}
              className={`focus-ring rounded-lg px-3 py-2 text-sm font-bold ${option === filter ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"}`}>
              {filterLabels[option]} <span className="text-slate-500">{counts[option]}</span>
            </Link>
          ))}
        </nav>
        <form role="search" className="relative w-full sm:w-72">
          {filter !== "todos" ? <input type="hidden" name="filtro" value={filter} /> : null}
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <input type="search" name="q" defaultValue={search} placeholder="Buscar por título" aria-label="Buscar por título"
            className="focus-ring w-full rounded-xl border border-white/10 bg-black/15 py-2.5 pl-9 pr-3 text-sm outline-none" />
        </form>
      </div>

      {projects.length ? (
        <ul className="card divide-y divide-white/5 rounded-2xl">
          {projects.map((project) => {
            const badge = visibilityBadge[project.visibility];
            return (
              <li key={project.id}>
                <Link href={`/admin/projetos/${project.id}`} className="focus-ring grid gap-3 p-4 hover:bg-white/[.03] sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-bold">
                      <span className="truncate">{project.title}</span>
                      {project.featured ? <Star size={14} className="shrink-0 fill-amber-300 text-amber-300" aria-label="Em destaque" /> : null}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {project.category} · /{project.slug} · {project.technologies} tecnologias · ordem {project.display_order}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:justify-end">
                    <span className="text-slate-500">Atualizado {formatDateTime(project.updated_at)}</span>
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${badge.className}`}>{badge.label}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card rounded-2xl p-8 text-center text-sm text-slate-400">
          {search || filter !== "todos" ? "Nenhum projeto encontrado com esses filtros." : "Nenhum projeto cadastrado ainda."}
        </div>
      )}
    </div>
  );
}
