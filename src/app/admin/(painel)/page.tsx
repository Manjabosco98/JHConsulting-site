import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/repositories/dashboard";
import { contactStatusLabels, formatDateTime } from "@/lib/admin/labels";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = { title: "Dashboard" };

function StatCard({ href, label, value, detail }: { href: string; label: string; value: number; detail: string }) {
  return (
    <Link href={href} className="card focus-ring group rounded-2xl p-5 transition-colors hover:border-blue-400/30">
      <p className="text-xs font-bold uppercase tracking-[.14em] text-slate-400">{label}</p>
      <p className="mt-3 text-4xl font-black tracking-tight">{value}</p>
      <p className="mt-2 flex items-center justify-between gap-2 text-sm text-slate-400">
        {detail}
        <ArrowRight size={16} className="text-slate-600 transition-colors group-hover:text-blue-300" aria-hidden="true" />
      </p>
    </Link>
  );
}

function projectState(project: { published: boolean; archived_at: string | null }) {
  if (project.archived_at) return { label: "Arquivado", className: "text-slate-400" };
  if (project.published) return { label: "Publicado", className: "text-emerald-300" };
  return { label: "Rascunho", className: "text-amber-300" };
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const data = await getDashboardData(await createClient());
  const { projects, services, technologies, contacts } = data;

  return (
    <div className="grid gap-8">
      <AdminPageHeader title="Dashboard" description="Visão geral do conteúdo publicado no site e dos contatos recebidos." />

      <section aria-label="Resumo" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard href="/admin/projetos" label="Projetos" value={projects.total}
          detail={`${projects.published} publicados · ${projects.drafts} rascunhos · ${projects.archived} arquivados`} />
        <StatCard href="/admin/servicos" label="Serviços" value={services.total} detail={`${services.active} ativos`} />
        <StatCard href="/admin/tecnologias" label="Tecnologias" value={technologies.total} detail={`${technologies.active} ativas`} />
        <StatCard href="/admin/contatos" label="Contatos" value={contacts.total} detail={`${contacts.new} novos`} />
      </section>

      <section aria-labelledby="pendencias" className="card rounded-2xl p-5">
        <h2 id="pendencias" className="font-black">Configurações do site</h2>
        {data.missingSettings === null ? (
          <p className="mt-3 flex items-start gap-3 text-sm text-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            As informações institucionais ainda não foram cadastradas.
          </p>
        ) : data.missingSettings.length ? (
          <p className="mt-3 flex items-start gap-3 text-sm text-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              Campos públicos sem preenchimento: {data.missingSettings.join(", ")}.{" "}
              <Link href="/admin/configuracoes" className="font-bold underline underline-offset-4">Revisar configurações</Link>
            </span>
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-3 text-sm text-emerald-300">
            <CheckCircle2 size={18} aria-hidden="true" /> Informações de contato completas.
          </p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section aria-labelledby="ultimos-contatos" className="card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 id="ultimos-contatos" className="font-black">Últimos contatos</h2>
            <Link href="/admin/contatos" className="focus-ring rounded text-sm font-bold text-blue-300">Ver todos</Link>
          </div>
          {data.recentContacts.length ? (
            <ul className="mt-4 divide-y divide-white/5">
              {data.recentContacts.map((contact) => (
                <li key={contact.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-bold">{contact.name}{contact.company ? ` · ${contact.company}` : ""}</p>
                    <p className="text-slate-400">{contact.project_type} · {formatDateTime(contact.created_at)}</p>
                  </div>
                  <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs font-bold text-slate-300">
                    {contactStatusLabels[contact.status]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Nenhum contato recebido ainda.</p>
          )}
        </section>

        <section aria-labelledby="projetos-recentes" className="card rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 id="projetos-recentes" className="font-black">Projetos atualizados recentemente</h2>
            <Link href="/admin/projetos" className="focus-ring rounded text-sm font-bold text-blue-300">Ver todos</Link>
          </div>
          {data.recentProjects.length ? (
            <ul className="mt-4 divide-y divide-white/5">
              {data.recentProjects.map((project) => {
                const state = projectState(project);
                return (
                  <li key={project.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{project.title}</p>
                      <p className="text-slate-400">Atualizado em {formatDateTime(project.updated_at)}</p>
                    </div>
                    <span className={`text-xs font-bold ${state.className}`}>{state.label}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-400">Nenhum projeto cadastrado.</p>
          )}
        </section>
      </div>
    </div>
  );
}
