"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { updateContactStatus } from "@/lib/repositories/contacts";
import { contactStatuses } from "@/lib/admin/labels";

const uuid = z.string().uuid();
const statusSchema = z.enum(contactStatuses);

/**
 * The only write the admin can make on a lead. The message, name and e-mail of
 * a contact are historical record: the grant on public.contacts allows
 * update(status) and nothing else.
 */
export async function updateContactStatusAction(formData: FormData) {
  await requireAdmin();

  const id = uuid.safeParse(formData.get("id"));
  if (!id.success) redirect("/admin/contatos");

  const status = statusSchema.safeParse(formData.get("status"));
  if (!status.success) redirect(`/admin/contatos/${id.data}?erro=status`);

  const result = await updateContactStatus(await createClient(), id.data, status.data);
  redirect(
    result.ok
      ? `/admin/contatos/${id.data}?atualizado=1`
      : `/admin/contatos/${id.data}?erro=${result.reason === "not_found" ? "inexistente" : "status"}`
  );
}
