import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Contatos" };

export default async function AdminContactsPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Contatos" description="Mensagens recebidas pelo formulário do site e acompanhamento do atendimento." phase={13} />;
}
