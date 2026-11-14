import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, MessageSquare, Plus, Settings, Wrench, type LucideIcon } from "lucide-react";
import { requireAdminWith } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/lib/repositories/dashboard";
import { contactStatusBadge, contactStatusLabels, formatDateTime } from "@/lib/admin/labels";

export const metadata: Metadata = { title: "Visão geral" };

function StatCard({ href, label, value, detail, icon: Icon }: { href: string; label: string; value: number; detail: string; icon: LucideIcon }) {
  return (
    <Link href={href} className="card focus-ring group min-w-0 rounded-2xl p-5 transition-colors hover:border-blue-400/40 sm:p-6">
      <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-300">{label}</p><Icon size={18} className="shrink-0 text-blue-300" aria-hidden="true" /></div>
      <p className="mt-5 text-4xl font-bold tracking-tight">{value}</p>
      <p className="mt-3 flex items-center justify-between gap-3 text-xs leading-5 text-slate-400">{detail}<ArrowRight size={16} className="shrink-0 text-blue-300 transition-transform group-hover:translate-x-1" aria-hidden="true" /></p>
    </Link>
  );
}

export default async function AdminDashboardPage() {
  const data = await requireAdminWith(getDashboardData(await createClient()));
  const { services, contacts } = data;
  const quickActions = [
    { href: "/admin/contatos?status=NEW", title: "Atender novos contatos", copy: "Veja quem aguarda o primeiro retorno.", icon: MessageSquare },
    { href: "/admin/servicos/novo", title: "Adicionar serviço", copy: "Apresente uma nova solução no site.", icon: Plus },
    { href: "/admin/configuracoes", title: "Atualizar a empresa", copy: "Revise os dados e canais de contato.", icon: Settings }
  ];
  return (
    <div className="grid gap-8">
      <section className="company-panel rounded-3xl border border-blue-400/15 p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-blue-300">Gestão da empresa</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-5">
          <div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Visão geral</h1><p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">Acompanhe os contatos recebidos e mantenha os serviços e as informações da JHConsulting atualizados.</p></div>
          <Link href="/admin/contatos?status=NEW" className="btn-primary focus-ring inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold">Ver novos contatos <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </section>

      <section aria-label="Resumo da operação" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard href="/admin/contatos?status=NEW" label="Novos contatos" value={contacts.NEW} detail="Aguardando o primeiro retorno" icon={MessageSquare} />
        <StatCard href="/admin/contatos?status=NEGOTIATING" label="Em negociação" value={contacts.NEGOTIATING} detail="Oportunidades em acompanhamento" icon={ArrowRight} />
        <StatCard href="/admin/contatos?status=CONVERTED" label="Convertidos" value={contacts.CONVERTED} detail="Contatos com atendimento convertido" icon={CheckCircle2} />
        <StatCard href="/admin/servicos" label="Serviços no site" value={services.active} detail={`${services.total} cadastrados · ${services.total - services.active} inativos`} icon={Wrench} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="contatos-em-aberto" className="card min-w-0 rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 id="contatos-em-aberto" className="font-bold">Contatos para acompanhar</h2><p className="mt-2 text-xs leading-6 text-slate-400">{contacts.NEW + contacts.CONTACTED + contacts.NEGOTIATING} em aberto · {contacts.total} recebidos no total</p></div><Link href="/admin/contatos" className="focus-ring rounded text-sm font-bold text-blue-300">Ver todos</Link></div>
          {data.recentContacts.length ? <ul className="mt-5 divide-y divide-white/8">
            {data.recentContacts.map((contact) => <li key={contact.id}>
              <Link href={`/admin/contatos/${contact.id}`} className="focus-ring flex min-w-0 flex-wrap items-start justify-between gap-3 rounded-lg py-4 hover:bg-white/[.025]">
                <div className="min-w-0 flex-1 basis-40"><p className="break-words text-sm font-bold">{contact.name}</p>{contact.company ? <p className="mt-1 break-words text-xs text-slate-300">{contact.company}</p> : null}<p className="mt-2 text-xs leading-5 text-slate-400">{contact.project_type} · {formatDateTime(contact.created_at)}</p></div>
                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${contactStatusBadge[contact.status]}`}>{contactStatusLabels[contact.status]}</span>
              </Link>
            </li>)}
          </ul> : <div className="mt-6 rounded-xl border border-dashed border-blue-400/15 p-6"><CheckCircle2 size={24} className="text-blue-300" aria-hidden="true" /><p className="mt-3 text-sm font-semibold">Nenhum atendimento em aberto.</p><p className="mt-2 text-xs leading-6 text-slate-400">Os próximos contatos enviados pelo formulário aparecerão aqui.</p></div>}
        </section>
        <div className="grid content-start gap-6">
          <section aria-labelledby="servicos-no-site" className="card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3"><h2 id="servicos-no-site" className="font-bold">Catálogo de serviços</h2><Link href="/admin/servicos" className="focus-ring rounded text-sm font-bold text-blue-300">Gerenciar</Link></div>
            {data.recentServices.length ? <ul className="mt-5 divide-y divide-white/8">{data.recentServices.map((service) => <li key={service.id}><Link href={`/admin/servicos/${service.id}`} className="focus-ring flex items-start justify-between gap-3 rounded-lg py-3.5 text-sm hover:bg-white/[.025]"><span className="min-w-0 break-words font-medium">{service.title}</span><span className={`shrink-0 text-xs ${service.active ? "text-blue-200" : "text-slate-400"}`}>{service.active ? "No site" : "Inativo"}</span></Link></li>)}</ul> : <p className="mt-5 text-sm leading-7 text-slate-400">Cadastre o primeiro serviço para apresentar as soluções da empresa.</p>}
          </section>
          <section aria-labelledby="configuracoes-do-site" className="card rounded-2xl p-5 sm:p-6">
            <h2 id="configuracoes-do-site" className="font-bold">Informações da empresa</h2>
            {data.missingSettings === null ? <p className="mt-4 flex items-start gap-3 text-sm leading-6 text-amber-200"><AlertTriangle size={18} className="mt-1 shrink-0" aria-hidden="true" />Cadastre os dados e os contatos da empresa.</p>
              : data.missingSettings.length ? <p className="mt-4 flex items-start gap-3 text-sm leading-6 text-amber-200"><AlertTriangle size={18} className="mt-1 shrink-0" aria-hidden="true" /><span>Complete os canais de contato: {data.missingSettings.join(", ")}.</span></p>
              : <p className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-300"><CheckCircle2 size={18} className="mt-1 shrink-0 text-blue-300" aria-hidden="true" />Os canais de contato estão preenchidos.</p>}
            <Link href="/admin/configuracoes" className="focus-ring mt-5 inline-flex items-center gap-2 rounded text-sm font-bold text-blue-300">Revisar informações <ArrowRight size={15} aria-hidden="true" /></Link>
          </section>
        </div>
      </div>

      <section aria-label="Ações rápidas" className="grid gap-4 md:grid-cols-3">{quickActions.map(({href,title,copy,icon:Icon}) => <Link key={href} href={href} className="focus-ring rounded-2xl border border-white/10 p-5 transition hover:border-blue-400/30 hover:bg-white/[.025]"><Icon size={20} className="text-blue-300" aria-hidden="true" /><h2 className="mt-4 text-sm font-bold">{title}</h2><p className="mt-2 text-xs leading-6 text-slate-400">{copy}</p></Link>)}</section>
    </div>
  );
}
