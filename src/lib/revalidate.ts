import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Purges the cache of every public page that renders project data, so admin
 * changes appear without a deploy. The home Projects section, the /projetos
 * listing and every /projetos/[slug] detail page. The sitemap uses the same
 * data and is revalidated by its own segment `revalidate`.
 */
export function revalidatePublicProjects() {
  revalidatePath("/");
  revalidatePath("/projetos");
  revalidatePath("/projetos/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
