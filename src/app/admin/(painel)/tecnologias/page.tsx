import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdminWith } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { listAdminTechnologies, listAdminTechnologyGroups } from "@/lib/repositories/technologies";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = { title: "Tecnologias" };

export default async function AdminTechnologiesPage({ searchParams }: { searchParams: Promise<{ excluido?: string; grupo_excluido?: string }> }) {
  const supabase = await createClient();
  const [query, technologies, groups] = await Promise.all([
    searchParams,
    requireAdminWith(listAdminTechnologies(supabase)),
    listAdminTechnologyGroups(supabase)
  ]);
  const activeTechnologies = technologies.filter((technology) => technology.active).length;

  return (
    <div className="grid gap-8">
      <AdminPageHeader
        title="Tecnologias"
        description="Catálogo de tecnologias e os grupos da seção Tecnologias do site. Uma tecnologia pode estar em vários grupos."
      />

      {query.excluido ? <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Tecnologia excluída.</p> : null}
      {query.grupo_excluido ? <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Grupo excluído.</p> : null}

      <section aria-labelledby="grupos" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="grupos" className="text-xl font-black">Grupos <span className="text-sm font-bold text-slate-500">({groups.length})</span></h2>
          <div className="text-sm font-bold">
            <Link href="/admin/tecnologias/grupos/novo" className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-slate-200 hover:bg-white/5">
              <Plus size={16} aria-hidden="true" /> Novo grupo
            </Link>
          </div>
        </div>
        {groups.length ? (
          <ul className="card divide-y divide-white/5 rounded-2xl">
            {groups.map((group) => (
              <li key={group.id}>
                <Link href={`/admin/tecnologias/grupos/${group.id}`} className="focus-ring flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-white/[.03] sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{group.name}</p>
                    <p className="mt-1 text-sm text-slate-400">/{group.slug} · ordem {group.display_order} · {group.members} tecnologias</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${group.active ? "border-emerald-400/30 text-emerald-300" : "border-white/10 text-slate-400"}`}>
                    {group.active ? "Ativo" : "Inativo"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card rounded-2xl p-6 text-center text-sm text-slate-400">Nenhum grupo cadastrado.</div>
        )}
      </section>

      <section aria-labelledby="catalogo" className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="catalogo" className="text-xl font-black">
            Catálogo <span className="text-sm font-bold text-slate-500">({activeTechnologies} de {technologies.length} ativas)</span>
          </h2>
          <div className="text-sm font-bold">
            <Link href="/admin/tecnologias/nova" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 hover:bg-blue-500">
              <Plus size={16} aria-hidden="true" /> Nova tecnologia
            </Link>
          </div>
        </div>
        {technologies.length ? (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {technologies.map((technology) => (
              <li key={technology.id}>
                <Link href={`/admin/tecnologias/${technology.id}`} className="card focus-ring flex items-center justify-between gap-3 rounded-xl p-3 transition-colors hover:border-blue-400/30">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{technology.name}{technology.active ? "" : " (inativa)"}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {technology.groups} grupo(s) · {technology.projects} projeto(s)
                    </p>
                  </div>
                  {technology.active ? null : <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-bold text-slate-400">Inativa</span>}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="card rounded-2xl p-6 text-center text-sm text-slate-400">Nenhuma tecnologia cadastrada.</div>
        )}
      </section>
    </div>
  );
}
