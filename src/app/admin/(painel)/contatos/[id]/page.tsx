import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminContact } from "@/lib/repositories/contacts";
import { contactStatusBadge, contactStatusLabels, contactStatuses, formatDateTime } from "@/lib/admin/labels";
import { whatsappLink } from "@/lib/whatsapp";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { updateContactStatusAction } from "../actions";

export const metadata: Metadata = { title: "Contato" };

const uuid = z.string().uuid();

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ atualizado?: string; erro?: string }>;
};

const errorMessages: Record<string, string> = {
  status: "Não foi possível alterar o status agora. Tente novamente.",
  inexistente: "Este contato não existe mais."
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm">{children}</dd>
    </div>
  );
}

export default async function AdminContactPage({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ id }, flags] = await Promise.all([params, searchParams]);
  if (!uuid.safeParse(id).success) notFound();

  const contact = await getAdminContact(await createClient(), id);
  if (!contact) notFound();

  const phone = contact.whatsapp.replace(/\D/g, "");
  const firstName = contact.name.split(" ")[0];

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/admin/contatos" className="focus-ring inline-flex items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
          <ArrowLeft size={16} aria-hidden="true" /> Contatos
        </Link>
      </div>

      <AdminPageHeader
        title={contact.name}
        description={`${contact.project_type} · recebido em ${formatDateTime(contact.created_at)}`}
        actions={
          <span className={`self-center rounded-full border px-3 py-1.5 text-xs font-bold ${contactStatusBadge[contact.status]}`}>
            {contactStatusLabels[contact.status]}
          </span>
        }
      />

      {flags.atualizado ? (
        <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          Status atualizado.
        </p>
      ) : null}
      {flags.erro ? (
        <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessages[flags.erro] ?? errorMessages.status}
        </p>
      ) : null}

      <section aria-labelledby="mensagem" className="card rounded-2xl p-5 sm:p-6">
        <h2 id="mensagem" className="font-black">Mensagem</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-300">{contact.message}</p>
      </section>

      <section aria-labelledby="dados" className="card rounded-2xl p-5 sm:p-6">
        <h2 id="dados" className="font-black">Dados do contato</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="E-mail">
            <a href={`mailto:${contact.email}`} className="focus-ring rounded font-bold text-blue-300 hover:text-blue-200">{contact.email}</a>
          </Field>
          <Field label="WhatsApp">{contact.whatsapp || <span className="text-slate-500">Não informado</span>}</Field>
          <Field label="Empresa">{contact.company || <span className="text-slate-500">Não informada</span>}</Field>
          <Field label="Tipo de projeto">{contact.project_type}</Field>
          <Field label="Origem">{contact.source}</Field>
          <Field label="Última atualização">{formatDateTime(contact.updated_at)}</Field>
        </dl>

        <div className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
          <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`JHConsulting — ${contact.project_type}`)}`}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 hover:bg-blue-500">
            <Mail size={16} aria-hidden="true" /> Responder por e-mail
          </a>
          {phone ? (
            <a href={whatsappLink(contact.whatsapp, `Olá ${firstName}, aqui é da JHConsulting. Recebi sua solicitação pelo site.`)}
              target="_blank" rel="noopener noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 hover:bg-white/[.06]">
              <MessageCircle size={16} aria-hidden="true" /> Abrir no WhatsApp
            </a>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="atendimento" className="card rounded-2xl p-5 sm:p-6">
        <h2 id="atendimento" className="font-black">Andamento do atendimento</h2>
        <p className="mt-2 text-sm text-slate-400">
          O status é o único campo editável: nome, mensagem e contato ficam como o visitante enviou.
        </p>
        <form action={updateContactStatusAction} data-form="contact-status" className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={contact.id} />
          <label className="grid gap-1.5 text-sm">
            <span className="font-bold">Status</span>
            <select name="status" defaultValue={contact.status}
              className="focus-ring rounded-xl border border-white/10 bg-[#0a101d] px-4 py-2.5 outline-none">
              {contactStatuses.map((option) => (
                <option key={option} value={option}>{contactStatusLabels[option]}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="focus-ring rounded-xl bg-blue-600 px-4 py-2.5 text-sm hover:bg-blue-500">
            Salvar status
          </button>
        </form>
      </section>
    </div>
  );
}
