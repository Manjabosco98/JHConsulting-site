import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Projetos" };

export default async function AdminProjectsPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Projetos" description="Cadastre, edite, publique e ordene os projetos do portfólio." phase={7} />;
}
