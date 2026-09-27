"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import {
  deleteTechnology, deleteTechnologyGroup, saveTechnology, saveTechnologyGroup
} from "@/lib/repositories/technologies";
import {
  parseTechnologyForm, parseTechnologyGroupForm,
  type TechnologyFieldErrors, type TechnologyGroupFieldErrors
} from "@/lib/validation/technology";
import { revalidatePublicTechnologies } from "@/lib/revalidate";

export type TechnologyFormState = {
  status: "idle" | "error" | "saved";
  message: string | null;
  fieldErrors: TechnologyFieldErrors;
};
export type TechnologyGroupFormState = {
  status: "idle" | "error" | "saved";
  message: string | null;
  fieldErrors: TechnologyGroupFieldErrors;
};

const uuid = z.string().uuid();
const failureMessages = {
  not_found: "Este registro não existe mais.",
  invalid_technology: "Uma das tecnologias selecionadas não existe mais. Recarregue a página.",
  forbidden: "Sua sessão não tem permissão para alterar tecnologias.",
  unknown: "Não foi possível salvar agora. Tente novamente."
} as const;

export async function saveTechnologyAction(
  technologyId: string | null,
  _previous: TechnologyFormState,
  formData: FormData
): Promise<TechnologyFormState> {
  await requireAdmin();
  if (technologyId !== null && !uuid.safeParse(technologyId).success) {
    return { status: "error", message: failureMessages.not_found, fieldErrors: {} };
  }

  const parsed = parseTechnologyForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.fieldErrors };
  }

  const result = await saveTechnology(await createClient(), technologyId, parsed.data);
  if (!result.ok) {
    if (result.reason === "slug_taken") {
      return { status: "error", message: "Revise os campos destacados.", fieldErrors: { slug: "Já existe uma tecnologia com este slug." } };
    }
    return { status: "error", message: failureMessages[result.reason], fieldErrors: {} };
  }

  revalidatePublicTechnologies();
  if (technologyId === null) redirect(`/admin/tecnologias/${result.id}?criado=1`);
  return { status: "saved", message: "Tecnologia salva.", fieldErrors: {} };
}

export async function deleteTechnologyAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/tecnologias");

  const result = await deleteTechnology(await createClient(), id.data);
  if (result.ok) {
    revalidatePublicTechnologies();
    redirect("/admin/tecnologias?excluido=1");
  }
  redirect(`/admin/tecnologias/${id.data}?erro=${result.reason}`);
}

export async function saveTechnologyGroupAction(
  groupId: string | null,
  _previous: TechnologyGroupFormState,
  formData: FormData
): Promise<TechnologyGroupFormState> {
  await requireAdmin();
  if (groupId !== null && !uuid.safeParse(groupId).success) {
    return { status: "error", message: failureMessages.not_found, fieldErrors: {} };
  }

  const parsed = parseTechnologyGroupForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.fieldErrors };
  }

  const result = await saveTechnologyGroup(await createClient(), groupId, parsed.data);
  if (!result.ok) {
    if (result.reason === "slug_taken") {
      return { status: "error", message: "Revise os campos destacados.", fieldErrors: { slug: "Já existe um grupo com este slug." } };
    }
    return { status: "error", message: failureMessages[result.reason], fieldErrors: {} };
  }

  revalidatePublicTechnologies();
  if (groupId === null) redirect(`/admin/tecnologias/grupos/${result.id}?criado=1`);
  return { status: "saved", message: "Grupo salvo.", fieldErrors: {} };
}

export async function deleteTechnologyGroupAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/tecnologias");

  const result = await deleteTechnologyGroup(await createClient(), id.data);
  if (result.ok) revalidatePublicTechnologies();
  // A lista de grupos vive na página principal de tecnologias.
  redirect(result.ok ? "/admin/tecnologias?grupo_excluido=1" : `/admin/tecnologias/grupos/${id.data}?erro=exclusao`);
}
