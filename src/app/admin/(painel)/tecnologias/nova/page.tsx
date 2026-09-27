import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TechnologyForm } from "@/components/admin/technologies/TechnologyForm";
import { saveTechnologyAction } from "../actions";

export const metadata: Metadata = { title: "Nova tecnologia" };

export default async function NewTechnologyPage() {
  await requireAdmin();
  return (
    <div className="grid gap-6">
      <Link href="/admin/tecnologias" className="focus-ring inline-flex w-fit items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} aria-hidden="true" /> Tecnologias
      </Link>
      <AdminPageHeader title="Nova tecnologia" description="Depois de criar, adicione a tecnologia a um grupo para ela aparecer na seção Tecnologias." />
      <TechnologyForm
        action={saveTechnologyAction.bind(null, null)}
        initialValues={{ name: "", slug: "", active: true, display_order: "0" }}
        isNew
      />
    </div>
  );
}
