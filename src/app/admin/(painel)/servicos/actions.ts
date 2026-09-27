"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { deleteService, saveService } from "@/lib/repositories/services";
import { parseServiceForm, type ServiceFieldErrors } from "@/lib/validation/service";
import { revalidatePublicServices } from "@/lib/revalidate";

export type ServiceFormState = {
  status: "idle" | "error" | "saved";
  message: string | null;
  fieldErrors: ServiceFieldErrors;
};

const uuid = z.string().uuid();
const failureMessages = {
  not_found: "Este serviço não existe mais.",
  forbidden: "Sua sessão não tem permissão para alterar serviços.",
  unknown: "Não foi possível salvar agora. Tente novamente."
} as const;

/** Bound with the service id on the edit page; null creates a new service. */
export async function saveServiceAction(
  serviceId: string | null,
  _previous: ServiceFormState,
  formData: FormData
): Promise<ServiceFormState> {
  await requireAdmin();
  if (serviceId !== null && !uuid.safeParse(serviceId).success) {
    return { status: "error", message: failureMessages.not_found, fieldErrors: {} };
  }

  const parsed = parseServiceForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.fieldErrors };
  }

  const result = await saveService(await createClient(), serviceId, parsed.data);
  if (!result.ok) {
    if (result.reason === "slug_taken") {
      return { status: "error", message: "Revise os campos destacados.", fieldErrors: { slug: "Já existe um serviço com este slug." } };
    }
    return { status: "error", message: failureMessages[result.reason], fieldErrors: {} };
  }

  revalidatePublicServices();
  if (serviceId === null) redirect(`/admin/servicos/${result.id}?criado=1`);
  return { status: "saved", message: "Serviço salvo.", fieldErrors: {} };
}

export async function deleteServiceAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/servicos");

  const result = await deleteService(await createClient(), id.data);
  if (result.ok) revalidatePublicServices();
  redirect(result.ok ? "/admin/servicos?excluido=1" : `/admin/servicos/${id.data}?erro=exclusao`);
}
