import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Configurações" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Configurações" description="Informações institucionais, contato público e redes sociais." phase={12} />;
}
