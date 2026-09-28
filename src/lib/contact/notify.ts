import "server-only";

import { Resend } from "resend";
import type { ContactPayload } from "@/lib/validation/contact";
import { hasEmailConfig, readTrimmedEnv as read } from "./config";

export type NotifyResult = { ok: true } | { ok: false; reason: "not_configured" | "failed" };

function body(payload: ContactPayload, contactId: string | null) {
  const lines = [
    `Nome: ${payload.name}`,
    `Empresa: ${payload.company || "-"}`,
    `Email: ${payload.email}`,
    `WhatsApp: ${payload.whatsapp || "-"}`,
    `Tipo: ${payload.projectType}`,
    "",
    payload.message
  ];
  const siteUrl = read("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
  if (contactId && siteUrl) lines.push("", `Painel: ${siteUrl}/admin/contatos/${contactId}`);
  return lines.join("\n");
}

/**
 * Best-effort notification. It never throws: the lead is already stored by the
 * time this runs, so a delivery problem must not turn into a failed submission.
 * Returns `not_configured` while the Resend account is still being set up.
 */
export async function notifyNewContact(
  payload: ContactPayload,
  contactId: string | null = null
): Promise<NotifyResult> {
  if (!hasEmailConfig()) return { ok: false, reason: "not_configured" };

  try {
    const result = await new Resend(read("RESEND_API_KEY")).emails.send({
      from: read("CONTACT_FROM_EMAIL"),
      to: read("CONTACT_TO_EMAIL"),
      replyTo: payload.email,
      subject: `Novo lead JHConsulting — ${payload.projectType}`,
      text: body(payload, contactId)
    });
    if (result.error) {
      console.error(`[contact] email rejeitado: ${result.error.message}`);
      return { ok: false, reason: "failed" };
    }
    return { ok: true };
  } catch (error) {
    // The SDK throws on network and configuration problems, not only on 4xx.
    console.error(`[contact] email falhou: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    return { ok: false, reason: "failed" };
  }
}
