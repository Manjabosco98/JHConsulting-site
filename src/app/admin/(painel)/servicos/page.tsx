import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const metadata: Metadata = { title: "Serviços" };

export default async function AdminServicesPage() {
  await requireAdmin();
  return <AdminPlaceholder title="Serviços" description="Serviços exibidos na seção Serviços do site." phase={10} />;
}
