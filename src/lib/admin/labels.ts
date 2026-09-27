import type { Database } from "@/types/database";

export type ContactStatus = Database["public"]["Enums"]["contact_status"];

export const contactStatusLabels: Record<ContactStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  NEGOTIATING: "Em negociação",
  CONVERTED: "Convertido",
  ARCHIVED: "Arquivado"
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo"
});

export function formatDateTime(value: string) {
  return dateTimeFormat.format(new Date(value));
}
