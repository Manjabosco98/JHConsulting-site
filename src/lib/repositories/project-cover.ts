import "server-only";

import type { createClient } from "@/lib/supabase/server";
import { PORTFOLIO_BUCKET, isStoragePath, projectCoverPath, type ImageKind } from "@/lib/storage/images";

type Client = Awaited<ReturnType<typeof createClient>>;
export type CoverResult = { ok: true } | { ok: false; reason: "not_found" | "failed" };

async function currentCover(supabase: Client, projectId: string) {
  const { data, error } = await supabase.from("projects").select("cover_image").eq("id", projectId).maybeSingle();
  if (error) console.error(`[cover] read: ${error.message}`);
  return { found: Boolean(data), cover: data?.cover_image ?? null, error };
}

/** Best-effort removal of objects this app owns; failures only leave orphans, which are logged. */
async function removeObjects(supabase: Client, paths: string[]) {
  const owned = paths.filter(isStoragePath);
  if (!owned.length) return;
  const { error } = await supabase.storage.from(PORTFOLIO_BUCKET).remove(owned);
  if (error) console.error(`[cover] remove ${owned.join(", ")}: ${error.message}`);
}

/**
 * Uploads a new immutable object, points the project at it and only then
 * deletes the previous cover. If the database update fails, the new object is
 * removed so storage and database stay consistent.
 */
export async function replaceProjectCover(
  supabase: Client,
  projectId: string,
  image: { kind: ImageKind; bytes: Uint8Array }
): Promise<CoverResult> {
  const previous = await currentCover(supabase, projectId);
  if (previous.error) return { ok: false, reason: "failed" };
  if (!previous.found) return { ok: false, reason: "not_found" };

  const path = projectCoverPath(projectId, image.kind);
  const upload = await supabase.storage.from(PORTFOLIO_BUCKET).upload(path, image.bytes, {
    contentType: image.kind.mime,
    cacheControl: "31536000",
    upsert: false
  });
  if (upload.error) {
    console.error(`[cover] upload: ${upload.error.message}`);
    return { ok: false, reason: "failed" };
  }

  const { data, error } = await supabase.from("projects").update({ cover_image: path }).eq("id", projectId).select("id");
  if (error || !data?.length) {
    if (error) console.error(`[cover] update: ${error.message}`);
    await removeObjects(supabase, [path]);
    return { ok: false, reason: error ? "failed" : "not_found" };
  }

  if (previous.cover && previous.cover !== path) await removeObjects(supabase, [previous.cover]);
  return { ok: true };
}

export async function removeProjectCover(supabase: Client, projectId: string): Promise<CoverResult> {
  const previous = await currentCover(supabase, projectId);
  if (previous.error) return { ok: false, reason: "failed" };
  if (!previous.found) return { ok: false, reason: "not_found" };

  const { error } = await supabase.from("projects").update({ cover_image: null }).eq("id", projectId);
  if (error) {
    console.error(`[cover] clear: ${error.message}`);
    return { ok: false, reason: "failed" };
  }
  if (previous.cover) await removeObjects(supabase, [previous.cover]);
  return { ok: true };
}

/** After deleting a project: remove every object under projects/<id>/ (best-effort). */
export async function removeProjectFolder(supabase: Client, projectId: string) {
  const folder = `projects/${projectId}`;
  const { data, error } = await supabase.storage.from(PORTFOLIO_BUCKET).list(folder, { limit: 1000 });
  if (error) {
    console.error(`[cover] list ${folder}: ${error.message}`);
    return;
  }
  await removeObjects(supabase, (data ?? []).map((object) => `${folder}/${object.name}`));
}
