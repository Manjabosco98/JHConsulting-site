import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireAdminWith } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminTechnology } from "@/lib/repositories/technologies";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TechnologyForm } from "@/components/admin/technologies/TechnologyForm";
import { DeleteTechnologyForm } from "@/components/admin/technologies/DeleteForms";
import { saveTechnologyAction } from "../actions";

export const metadata: Metadata = { title: "Editar tecnologia" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string; erro?: string }> };

const deleteErrors: Record<string, string> = {
  in_use: "Esta tecnologia está vinculada a um ou mais projetos. Remova-a dos projetos antes de excluir, ou apenas desmarque \"Ativa\".",
  not_found: "Esta tecnologia não existe mais.",
  forbidden: "Sua sessão não tem permissão para excluir tecnologias.",
  unknown: "Não foi possível excluir agora. Tente novamente."
};

export default async function EditTechnologyPage({ params, searchParams }: Props) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const technology = await requireAdminWith(getAdminTechnology(await createClient(), id));
  if (!technology) notFound();
  const deleteError = query.erro ? deleteErrors[query.erro] ?? deleteErrors.unknown : null;

  return (
    <div className="grid gap-6">
      <Link href="/admin/tecnologias" className="focus-ring inline-flex w-fit items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} aria-hidden="true" /> Tecnologias
      </Link>
      <AdminPageHeader
        title={technology.name}
        description={`Em ${technology.groups} grupo(s) e ${technology.projects} projeto(s).`}
      />
      {query.criado ? <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Tecnologia criada.</p> : null}
      {deleteError ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{deleteError}</p> : null}

      <TechnologyForm
        action={saveTechnologyAction.bind(null, technology.id)}
        isNew={false}
        initialValues={{
          name: technology.name,
          slug: technology.slug,
          active: technology.active,
          display_order: String(technology.display_order)
        }}
      />

      <section aria-labelledby="excluir-tecnologia" className="card grid gap-3 rounded-2xl border-red-400/20 p-5">
        <h2 id="excluir-tecnologia" className="font-black">Excluir tecnologia</h2>
        <p className="text-sm text-slate-400">
          {technology.projects
            ? "Não é possível excluir: a tecnologia está vinculada a projetos. Desmarque \"Ativa\" para tirá-la do site."
            : "A exclusão é permanente e remove a tecnologia dos grupos. Para apenas tirá-la do site, desmarque \"Ativa\"."}
        </p>
        <DeleteTechnologyForm id={technology.id} name={technology.name} groups={technology.groups} />
      </section>
    </div>
  );
}
