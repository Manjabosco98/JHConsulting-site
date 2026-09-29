import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminWith } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { listTechnologyOptions } from "@/lib/repositories/projects";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TechnologyGroupForm } from "@/components/admin/technologies/TechnologyGroupForm";
import { saveTechnologyGroupAction } from "../../actions";

export const metadata: Metadata = { title: "Novo grupo" };

export default async function NewTechnologyGroupPage() {
  const technologies = await requireAdminWith(listTechnologyOptions(await createClient()));
  return (
    <div className="grid gap-6">
      <Link href="/admin/tecnologias" className="focus-ring inline-flex w-fit items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} aria-hidden="true" /> Tecnologias
      </Link>
      <AdminPageHeader title="Novo grupo" description="Grupos organizam as tecnologias exibidas na seção Tecnologias da home." />
      <TechnologyGroupForm
        action={saveTechnologyGroupAction.bind(null, null)}
        initialValues={{ name: "", slug: "", active: true, display_order: "0", technology_ids: [] }}
        isNew
        technologies={technologies}
      />
    </div>
  );
}
