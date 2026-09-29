import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminWith } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { listProjectSuggestions, listTechnologyOptions } from "@/lib/repositories/projects";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProjectForm, type ProjectFormValues } from "@/components/admin/projects/ProjectForm";
import { saveProjectAction } from "../actions";

export const metadata: Metadata = { title: "Novo projeto" };

const emptyProject: ProjectFormValues = {
  title: "", slug: "", category: "", status: "", short_description: "", description: "",
  problem: "", solution: "", repository_url: "", demo_url: "", featured: false,
  display_order: "0", visibility: "draft", technology_ids: []
};

export default async function NewProjectPage() {
  const supabase = await createClient();
  const [technologies, suggestions] = await Promise.all([
    requireAdminWith(listTechnologyOptions(supabase)),
    listProjectSuggestions(supabase)
  ]);

  return (
    <div className="grid gap-6">
      <Link href="/admin/projetos" className="focus-ring inline-flex w-fit items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} aria-hidden="true" /> Projetos
      </Link>
      <AdminPageHeader title="Novo projeto" description="Novos projetos começam como rascunho: publique quando estiverem prontos." />
      <ProjectForm action={saveProjectAction.bind(null, null)} initialValues={emptyProject} isNew
        technologies={technologies} suggestions={suggestions} />
    </div>
  );
}
