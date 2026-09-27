import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { SettingsInput } from "@/lib/validation/settings";
import { PORTFOLIO_BUCKET, isStoragePath, profilePhotoPath, type ImageKind } from "@/lib/storage/images";

type Client = Awaited<ReturnType<typeof createClient>>;
export const SETTINGS_ID = 1;

export type AdminSettings = SettingsInput & { profile_image: string | null; updated_at: string | null };

export type SaveSettingsResult = { ok: true } | { ok: false; reason: "forbidden" | "unknown" };
export type PhotoResult = { ok: true } | { ok: false; reason: "failed" };

export async function getAdminSettings(supabase: Client): Promise<AdminSettings | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("company_name, professional_name, role, description, bio, email, phone, whatsapp, linkedin_url, github_url, instagram_url, location, service_area, profile_image, updated_at")
    .eq("id", SETTINGS_ID)
    .maybeSingle();
  if (error) {
    console.error(`[settings] get: ${error.message}`);
    throw new Error("Não foi possível carregar as configurações.");
  }
  return data;
}

/** Upsert of the singleton row: works whether or not it has been created yet. */
export async function saveSettings(supabase: Client, input: SettingsInput): Promise<SaveSettingsResult> {
  const { error } = await supabase.from("site_settings").upsert({ id: SETTINGS_ID, ...input }, { onConflict: "id" });
  if (!error) return { ok: true };
  if (error.code === "42501") return { ok: false, reason: "forbidden" };
  console.error(`[settings] save: ${error.code} ${error.message}`);
  return { ok: false, reason: "unknown" };
}

async function currentPhoto(supabase: Client) {
  const { data, error } = await supabase.from("site_settings").select("profile_image").eq("id", SETTINGS_ID).maybeSingle();
  if (error) console.error(`[settings] photo read: ${error.message}`);
  return { error, photo: data?.profile_image ?? null };
}

async function removePhotoObject(supabase: Client, path: string | null) {
  if (!isStoragePath(path)) return;
  const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).remove([path]);
  if (error) console.error(`[settings] photo remove ${path}: ${error.message}`);
}

/**
 * Same order as the project cover: upload a new immutable object, point the row
 * at it, and only then delete the previous file. A failed update removes the
 * new object so storage and database stay consistent.
 */
export async function replaceProfilePhoto(
  supabase: Client,
  image: { kind: ImageKind; bytes: Uint8Array }
): Promise<PhotoResult> {
  const previous = await currentPhoto(supabase);
  if (previous.error) return { ok: false, reason: "failed" };

  const path = profilePhotoPath(image.kind);
  const upload = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, image.bytes, {
    contentType: image.kind.mime,
    cacheControl: "31536000",
    upsert: false
  });
  if (upload.error) {
    console.error(`[settings] photo upload: ${upload.error.message}`);
    return { ok: false, reason: "failed" };
  }

  const { data, error } = await supabase
    .from("site_settings")
    .update({ profile_image: path })
    .eq("id", SETTINGS_ID)
    .select("id");
  if (error || !data?.length) {
    if (error) console.error(`[settings] photo update: ${error.message}`);
    await removePhotoObject(supabase, path);
    return { ok: false, reason: "failed" };
  }

  if (previous.photo !== path) await removePhotoObject(supabase, previous.photo);
  return { ok: true };
}

export async function removeProfilePhoto(supabase: Client): Promise<PhotoResult> {
  const previous = await currentPhoto(supabase);
  if (previous.error) return { ok: false, reason: "failed" };

  const { error } = await supabase.from("site_settings").update({ profile_image: null }).eq("id", SETTINGS_ID);
  if (error) {
    console.error(`[settings] photo clear: ${error.message}`);
    return { ok: false, reason: "failed" };
  }
  await removePhotoObject(supabase, previous.photo);
  return { ok: true };
}
