import "server-only";

import { revalidatePath } from "next/cache";

/**
 * Public pages that render project data. The home still reads src/constants
 * until phase 9; revalidating it now keeps admin changes ready to appear once
 * it reads from Supabase. Phase 9 adds /projetos and /projetos/[slug].
 */
export function revalidatePublicProjects() {
  revalidatePath("/");
}
