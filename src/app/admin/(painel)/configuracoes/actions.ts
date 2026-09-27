"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { removeProfilePhoto, replaceProfilePhoto, saveSettings } from "@/lib/repositories/settings";
import { parseSettingsForm, type SettingsFieldErrors } from "@/lib/validation/settings";
import { validateImageFile } from "@/lib/storage/images";
import { revalidatePublicSettings } from "@/lib/revalidate";

export type SettingsFormState = {
  status: "idle" | "error" | "saved";
  message: string | null;
  fieldErrors: SettingsFieldErrors;
};
export type PhotoFormState = { status: "idle" | "error" | "saved"; message: string | null };

const failureMessages = {
  forbidden: "Sua sessão não tem permissão para alterar as configurações.",
  unknown: "Não foi possível salvar agora. Tente novamente."
} as const;

export async function saveSettingsAction(
  _previous: SettingsFormState,
  formData: FormData
): Promise<SettingsFormState> {
  await requireAdmin();

  const parsed = parseSettingsForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revise os campos destacados.", fieldErrors: parsed.fieldErrors };
  }

  const result = await saveSettings(await createClient(), parsed.data);
  if (!result.ok) return { status: "error", message: failureMessages[result.reason], fieldErrors: {} };

  revalidatePublicSettings();
  return { status: "saved", message: "Configurações salvas.", fieldErrors: {} };
}

/** intent=upload validates the image by its content; intent=remove clears it. */
export async function updateProfilePhotoAction(
  _previous: PhotoFormState,
  formData: FormData
): Promise<PhotoFormState> {
  await requireAdmin();
  const supabase = await createClient();

  if (formData.get("intent") === "remove") {
    const removed = await removeProfilePhoto(supabase);
    if (!removed.ok) return { status: "error", message: "Não foi possível remover a foto agora." };
    revalidatePublicSettings();
    return { status: "saved", message: "Foto removida." };
  }

  const image = await validateImageFile(formData.get("photo"));
  if (!image.ok) return { status: "error", message: image.error };

  const replaced = await replaceProfilePhoto(supabase, image);
  if (!replaced.ok) return { status: "error", message: "Não foi possível atualizar a foto agora." };

  revalidatePublicSettings();
  return { status: "saved", message: "Foto atualizada." };
}
