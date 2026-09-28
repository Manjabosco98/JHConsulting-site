import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseSecretKey } from "@/lib/supabase/secret";
import { hasEmailConfig } from "@/lib/contact/config";
import { countContactsByStatus, listAdminContacts } from "@/lib/repositories/contacts";
import { contactStatusBadge, contactStatusLabels, contactStatuses, formatDateTime, isContactStatus, type ContactStatus } from "@/lib/admin/labels";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = { title: "Contatos" };

type SearchParams = Promise<{ status?: string }>;

export default async function AdminContactsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const status: ContactStatus | null = isContactStatus(params.status) ? params.status : null;

  const supabase = await createClient();
  const [contacts, counts] = await Promise.all([
    listAdminContacts(supabase, status),
    countContactsByStatus(supabase)
  ]);

  const href = (next: ContactStatus | null) => (next ? `/admin/contatos?status=${next}` : "/admin/contatos");
  const tabs: { key: ContactStatus | null; label: string; count: number }[] = [
    { key: null, label: "Todos", count: counts.total },
    ...contactStatuses.map((option) => ({ key: option, label: contactStatusLabels[option], count: counts[option] }))
  ];

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Contatos"
        description="Solicitações recebidas pelo formulário do site. A mensagem é registro histórico: aqui você acompanha o atendimento pelo status."
      />

      {!hasSupabaseSecretKey() ? (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <strong className="font-bold">A variável SUPABASE_SECRET_KEY não está configurada.</strong> Enquanto isso, as
          solicitações enviadas pelo site não são gravadas aqui.
        </p>
      ) : null}

      {!hasEmailConfig() ? (
        <p role="status" className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          O envio de e-mail (Resend) ainda não está configurado. As solicitações continuam sendo gravadas nesta lista,
          mas você não recebe aviso por e-mail.
        </p>
      ) : null}

      <nav aria-label="Filtrar contatos" className="flex flex-wrap gap-1">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={href(tab.key)}
            aria-current={tab.key === status ? "page" : undefined}
            className={`focus-ring rounded-lg px-3 py-2 text-sm font-bold ${tab.key === status ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            {tab.label} <span className="text-slate-500">{tab.count}</span>
          </Link>
        ))}
      </nav>

      {contacts.length ? (
        <ul className="card divide-y divide-white/5 rounded-2xl">
          {contacts.map((contact) => {
            const badge = contactStatusBadge[contact.status];
            return (
              <li key={contact.id}>
                <Link href={`/admin/contatos/${contact.id}`} className="focus-ring grid gap-3 p-4 hover:bg-white/[.03] sm:grid-cols-[1fr_auto] sm:items-center sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {contact.name}
                      {contact.company ? <span className="font-normal text-slate-400"> · {contact.company}</span> : null}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-400">{contact.project_type} · {contact.email}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:justify-end">
                    <span className="text-slate-500">{formatDateTime(contact.created_at)}</span>
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${badge}`}>
                      {contactStatusLabels[contact.status]}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card rounded-2xl p-8 text-center text-sm text-slate-400">
          {status ? "Nenhum contato com este status." : "Nenhuma solicitação recebida ainda."}
        </div>
      )}
    </div>
  );
}
