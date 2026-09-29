import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireAdminWith } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminTechnologyGroup } from "@/lib/repositories/technologies";
import { listTechnologyOptions } from "@/lib/repositories/projects";
import { formatDateTime } from "@/lib/admin/labels";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TechnologyGroupForm } from "@/components/admin/technologies/TechnologyGroupForm";
import { DeleteTechnologyGroupForm } from "@/components/admin/technologies/DeleteForms";
import { saveTechnologyGroupAction } from "../../actions";

export const metadata: Metadata = { title: "Editar grupo" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string; erro?: string }> };

export default async function EditTechnologyGroupPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [group, technologies] = await Promise.all([
    requireAdminWith(getAdminTechnologyGroup(supabase, id)),
    listTechnologyOptions(supabase)
  ]);
  if (!group) notFound();

  return (
    <div className="grid gap-6">
      <Link href="/admin/tecnologias" className="focus-ring inline-flex w-fit items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} aria-hidden="true" /> Tecnologias
      </Link>
      <AdminPageHeader title={group.name} description={`Grupo atualizado em ${formatDateTime(group.updated_at)}`} />
      {query.criado ? <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Grupo criado{group.active ? " e ativo no site" : " como inativo"}.</p> : null}
      {query.erro === "exclusao" ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">Não foi possível excluir o grupo.</p> : null}

      <TechnologyGroupForm
        action={saveTechnologyGroupAction.bind(null, group.id)}
        isNew={false}
        technologies={technologies}
        initialValues={{
          name: group.name,
          slug: group.slug,
          active: group.active,
          display_order: String(group.display_order),
          technology_ids: group.technology_ids
        }}
      />

      <section aria-labelledby="excluir-grupo" className="card grid gap-3 rounded-2xl border-red-400/20 p-5">
        <h2 id="excluir-grupo" className="font-black">Excluir grupo</h2>
        <p className="text-sm text-slate-400">O grupo sai da seção Tecnologias. As tecnologias continuam no catálogo. Para apenas tirá-lo do site, desmarque &quot;Ativo&quot;.</p>
        <DeleteTechnologyGroupForm id={group.id} name={group.name} />
      </section>
    </div>
  );
}
