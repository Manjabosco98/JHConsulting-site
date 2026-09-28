import type { Database } from "@/types/database";

export type ContactStatus = Database["public"]["Enums"]["contact_status"];

export const contactStatusLabels: Record<ContactStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  NEGOTIATING: "Em negociação",
  CONVERTED: "Convertido",
  ARCHIVED: "Arquivado"
};

/**
 * Attendance order, used for the filter tabs and the status selector. Typed
 * against the generated enum, so a new database value breaks the build here.
 */
export const contactStatuses = [
  "NEW",
  "CONTACTED",
  "NEGOTIATING",
  "CONVERTED",
  "ARCHIVED"
] as const satisfies readonly ContactStatus[];

export function isContactStatus(value: unknown): value is ContactStatus {
  return typeof value === "string" && (contactStatuses as readonly string[]).includes(value);
}

/** Border and text classes for the status pill, shared by dashboard and list. */
export const contactStatusBadge: Record<ContactStatus, string> = {
  NEW: "border-blue-400/30 text-blue-300",
  CONTACTED: "border-amber-400/30 text-amber-300",
  NEGOTIATING: "border-violet-400/30 text-violet-300",
  CONVERTED: "border-emerald-400/30 text-emerald-300",
  ARCHIVED: "border-white/10 text-slate-400"
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo"
});

export function formatDateTime(value: string) {
  return dateTimeFormat.format(new Date(value));
}
