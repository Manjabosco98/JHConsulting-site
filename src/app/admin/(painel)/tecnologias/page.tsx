import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Tecnologias" };

export default async function AdminTechnologiesPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Tecnologias" description="Tecnologias, grupos da seção Tecnologias e vínculos com projetos." phase={11} />;
}
