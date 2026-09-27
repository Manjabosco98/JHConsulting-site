import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { getAdminService } from "@/lib/repositories/services";
import { DEFAULT_SERVICE_ICON, isServiceIconName } from "@/lib/services/icons";
import { formatDateTime } from "@/lib/admin/labels";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ServiceForm } from "@/components/admin/services/ServiceForm";
import { DeleteServiceForm } from "@/components/admin/services/DeleteServiceForm";
import { saveServiceAction } from "../actions";

export const metadata: Metadata = { title: "Editar serviço" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ criado?: string; erro?: string }> };

export default async function EditServicePage({ params, searchParams }: Props) {
  await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const service = await getAdminService(await createClient(), id);
  if (!service) notFound();

  return (
    <div className="grid gap-6">
      <Link href="/admin/servicos" className="focus-ring inline-flex w-fit items-center gap-2 rounded text-sm font-bold text-slate-400 hover:text-slate-200">
        <ArrowLeft size={15} aria-hidden="true" /> Serviços
      </Link>
      <AdminPageHeader title={service.title} description={`Atualizado em ${formatDateTime(service.updated_at)}`} />
      {query.criado ? <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Serviço criado{service.active ? " e ativo no site" : " como inativo"}.</p> : null}
      {query.erro === "exclusao" ? <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">Não foi possível excluir o serviço.</p> : null}

      <ServiceForm
        action={saveServiceAction.bind(null, service.id)}
        isNew={false}
        initialValues={{
          title: service.title,
          slug: service.slug,
          description: service.description,
          icon: isServiceIconName(service.icon) ? service.icon : DEFAULT_SERVICE_ICON,
          tech: service.tech,
          display_order: String(service.display_order),
          active: service.active
        }}
      />

      <section aria-labelledby="excluir-servico" className="card grid gap-3 rounded-2xl border-red-400/20 p-5">
        <h2 id="excluir-servico" className="font-black">Excluir serviço</h2>
        <p className="text-sm text-slate-400">A exclusão é permanente. Para apenas tirar do site, desmarque &quot;Ativo&quot;.</p>
        <DeleteServiceForm id={service.id} title={service.title} />
      </section>
    </div>
  );
}
