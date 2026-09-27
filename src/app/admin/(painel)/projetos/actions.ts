"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { deleteProject, saveProject } from "@/lib/repositories/projects";
import { removeProjectCover, removeProjectFolder, replaceProjectCover } from "@/lib/repositories/project-cover";
import { validateImageFile } from "@/lib/storage/images";
import { parseProjectForm, type ProjectFieldErrors } from "@/lib/validation/project";
import { revalidatePublicProjects } from "@/lib/revalidate";

export type ProjectFormState = {
  status: "idle" | "error" | "saved";
  message: string | null;
  fieldErrors: ProjectFieldErrors;
};

const uuid = z.string().uuid();
const failureMessages = {
  not_found: "Este projeto não existe mais.",
  invalid_technology: "Uma das tecnologias selecionadas não existe mais. Recarregue a página.",
  forbidden: "Sua sessão não tem permissão para alterar projetos.",
  unknown: "Não foi possível salvar agora. Tente novamente."
} as const;

/** Bound with the project id on the edit page; null creates a new project. */
export async function saveProjectAction(
  projectId: string | null,
  _previous: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  await requireAdmin();
  if (projectId !== null && !uuid.safeParse(projectId).success) {
    return { status: "error", message: failureMessages.not_found, fieldErrors: {} };
  }

  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.fieldErrors };
  }

  const result = await saveProject(await createClient(), projectId, parsed.data);
  if (!result.ok) {
    if (result.reason === "slug_taken") {
      return { status: "error", message: "Revise os campos destacados.", fieldErrors: { slug: "Já existe um projeto com este slug." } };
    }
    return { status: "error", message: failureMessages[result.reason], fieldErrors: {} };
  }

  revalidatePublicProjects();
  if (projectId === null) redirect(`/admin/projetos/${result.id}?criado=1`);
  return { status: "saved", message: "Projeto salvo.", fieldErrors: {} };
}

export async function deleteProjectAction(formData: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/projetos");

  const supabase = await createClient();
  const result = await deleteProject(supabase, id.data);
  if (result.ok) {
    await removeProjectFolder(supabase, id.data);
    revalidatePublicProjects();
  }
  redirect(result.ok ? "/admin/projetos?excluido=1" : `/admin/projetos/${id.data}?erro=exclusao`);
}

export type CoverFormState = { status: "idle" | "error" | "saved"; message: string | null };

const coverFailure = {
  not_found: "Este projeto não existe mais.",
  failed: "Não foi possível atualizar a capa agora. Tente novamente."
} as const;

/**
 * Bound with the project id. intent=upload validates the image by its content
 * (magic bytes) before storing it; intent=remove clears the cover.
 */
export async function updateProjectCoverAction(
  projectId: string,
  _previous: CoverFormState,
  formData: FormData
): Promise<CoverFormState> {
  await requireAdmin();
  if (!uuid.safeParse(projectId).success) return { status: "error", message: coverFailure.not_found };
  const supabase = await createClient();

  if (formData.get("intent") === "remove") {
    const removed = await removeProjectCover(supabase, projectId);
    if (!removed.ok) return { status: "error", message: coverFailure[removed.reason] };
    revalidatePublicProjects();
    return { status: "saved", message: "Capa removida." };
  }

  const image = await validateImageFile(formData.get("cover"));
  if (!image.ok) return { status: "error", message: image.error };
  const replaced = await replaceProjectCover(supabase, projectId, image);
  if (!replaced.ok) return { status: "error", message: coverFailure[replaced.reason] };
  revalidatePublicProjects();
  return { status: "saved", message: "Capa atualizada." };
}
