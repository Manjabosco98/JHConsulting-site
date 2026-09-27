import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm, type ServiceFormValues } from "@/components/admin/services/ServiceForm";
import { DEFAULT_SERVICE_ICON } from "@/lib/services/icons";
import { saveServiceAction } from "../actions";

export const metadata: Metadata = { title: "Novo serviço" };

const emptyService: ServiceFormValues = {
  title: "", slug: "", description: "", icon: DEFAULT_SERVICE_ICON, tech: "", display_order: "0", active: true
};

export default async function NewServicePage() {
  await requireAdmin();
  return (
    <div className="grid gap-6">
      <Link href="/admin/servicos" className="focus-ring inline-flex w-fit items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} aria-hidden="true" /> Serviços
      </Link>
      <AdminPageHeader title="Novo serviço" description="Serviços ativos aparecem na seção Serviços da home." />
      <ServiceForm action={saveServiceAction.bind(null, null)} initialValues={emptyService} isNew />
    </div>
  );
}
