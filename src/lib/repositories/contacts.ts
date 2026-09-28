import "server-only";

import type { createClient } from "@/lib/supabase/server";
import type { createSecretClient } from "@/lib/supabase/secret";
import { contactStatuses, type ContactStatus } from "@/lib/admin/labels";
import type { ContactRow } from "@/lib/validation/contact";

type Client = Awaited<ReturnType<typeof createClient>>;
type SecretClient = ReturnType<typeof createSecretClient>;
type CountResult = PromiseLike<{ count: number | null; error: { message: string } | null }>;

export type AdminContact = {
  id: string;
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  project_type: string;
  message: string;
  status: ContactStatus;
  source: string;
  created_at: string;
  updated_at: string;
};

/** Newest first; the admin list is paged by this ceiling, not by the database. */
export const CONTACT_LIST_LIMIT = 200;

const listColumns =
  "id, name, company, email, whatsapp, project_type, message, status, source, created_at, updated_at";

type StoreFailure = "denied" | "invalid" | "unknown";
export type StoreContactResult = { ok: true; id: string } | { ok: false; reason: StoreFailure };

// 42501 permission denied, 23514 check violation, 22001 value too long.
const storeFailures: Record<string, StoreFailure> = {
  "42501": "denied",
  "23514": "invalid",
  "22001": "invalid"
};

function fail(what: string, error: { message: string }): never {
  // Keep database details in server logs only.
  console.error(`[contacts] ${what}: ${error.message}`);
  throw new Error("Não foi possível carregar os contatos.");
}

/**
 * Stores a lead using the privileged client. Reads back only the id, which is
 * all the column grant allows, and never throws: losing a lead is worse than
 * returning a reason the endpoint can act on.
 */
export async function storeContact(
  supabase: SecretClient,
  row: ContactRow
): Promise<StoreContactResult> {
  const { data, error } = await supabase.from("contacts").insert(row).select("id");

  if (!error && data?.length) return { ok: true, id: data[0].id };
  if (!error) return { ok: false, reason: "unknown" };
  const reason = storeFailures[error.code] ?? "unknown";
  // The message can contain the visitor's own text, so log the code and nothing else.
  console.error(`[contacts] store: ${error.code} (${reason})`);
  return { ok: false, reason };
}

export async function listAdminContacts(
  supabase: Client,
  status: ContactStatus | null = null
): Promise<AdminContact[]> {
  const query = supabase.from("contacts").select(listColumns);
  const { data, error } = await (status ? query.eq("status", status) : query)
    .order("created_at", { ascending: false })
    .limit(CONTACT_LIST_LIMIT);
  if (error) fail("list", error);
  return data ?? [];
}

export async function getAdminContact(supabase: Client, id: string): Promise<AdminContact | null> {
  const { data, error } = await supabase
    .from("contacts")
    .select(listColumns)
    .eq("id", id)
    .maybeSingle();
  if (error) fail("get", error);
  return data;
}

export type ContactCounts = { total: number } & Record<ContactStatus, number>;

async function count(what: string, query: CountResult) {
  const { count, error } = await query;
  if (error) fail(what, error);
  return count ?? 0;
}

/** Counts for the filter tabs. Head-only queries, so no rows travel. */
export async function countContactsByStatus(supabase: Client): Promise<ContactCounts> {
  const head = { count: "exact", head: true } as const;
  const [total, ...perStatus] = await Promise.all([
    count("count total", supabase.from("contacts").select("id", head)),
    ...contactStatuses.map((status) =>
      count(`count ${status}`, supabase.from("contacts").select("id", head).eq("status", status))
    )
  ]);

  const counts = { total } as ContactCounts;
  contactStatuses.forEach((status, index) => {
    counts[status] = perStatus[index];
  });
  return counts;
}

type StatusFailure = "not_found" | "forbidden" | "unknown";
export type UpdateStatusResult = { ok: true } | { ok: false; reason: StatusFailure };

/**
 * Only `status` changes. The admin grant covers update(status) alone, so the
 * lead's own words stay exactly as the visitor wrote them.
 */
export async function updateContactStatus(
  supabase: Client,
  id: string,
  status: ContactStatus
): Promise<UpdateStatusResult> {
  const { data, error } = await supabase
    .from("contacts")
    .update({ status })
    .eq("id", id)
    .select("id");

  if (!error) return data?.length ? { ok: true } : { ok: false, reason: "not_found" };
  const reason: StatusFailure = error.code === "42501" ? "forbidden" : "unknown";
  if (reason === "unknown") console.error(`[contacts] status: ${error.code} ${error.message}`);
  return { ok: false, reason };
}
