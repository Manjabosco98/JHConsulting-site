import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { listAdminServices } from "@/lib/repositories/services";
import { resolveServiceIcon } from "@/lib/services/icons";
import { formatDateTime } from "@/lib/admin/labels";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = { title: "Serviços" };

export default async function AdminServicesPage({ searchParams }: { searchParams: Promise<{ excluido?: string }> }) {
  await requireAdmin();
  const [{ excluido }, services] = await Promise.all([searchParams, listAdminServices(await createClient())]);
  const active = services.filter((service) => service.active).length;

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title="Serviços"
        description={`Serviços exibidos na seção Serviços do site. ${active} de ${services.length} ativos.`}
        actions={
          <div className="text-sm font-bold">
            <Link href="/admin/servicos/novo" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 hover:bg-blue-500">
              <Plus size={16} aria-hidden="true" /> Novo serviço
            </Link>
          </div>
        }
      />

      {excluido ? <p role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">Serviço excluído.</p> : null}

      {services.length ? (
        <ul className="card divide-y divide-white/5 rounded-2xl">
          {services.map((service) => {
            const Icon = resolveServiceIcon(service.icon);
            return (
              <li key={service.id}>
                <Link href={`/admin/servicos/${service.id}`} className="focus-ring grid gap-3 p-4 hover:bg-white/[.03] sm:grid-cols-[auto_1fr_auto] sm:items-center sm:px-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-300">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-bold">{service.title}</p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      /{service.slug} · ordem {service.display_order}{service.tech ? ` · ${service.tech}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:justify-end">
                    <span className="text-slate-500">Atualizado {formatDateTime(service.updated_at)}</span>
                    <span className={`rounded-full border px-2.5 py-1 font-bold ${service.active ? "border-emerald-400/30 text-emerald-300" : "border-white/10 text-slate-400"}`}>
                      {service.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card rounded-2xl p-8 text-center text-sm text-slate-400">Nenhum serviço cadastrado ainda.</div>
      )}
    </div>
  );
}
