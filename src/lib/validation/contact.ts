import { z } from "zod";

/** Every lead stored by the public form. The column also accepts other origins. */
export const CONTACT_SOURCE = "SITE";

// Mirrors the CHECK constraint of public.contacts.email.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trimmed = (max: number) => z.string().trim().max(max);

/** Browsers submit <textarea> line breaks as CRLF; store a single convention. */
const normalizeLineBreaks = (value: unknown) =>
  typeof value === "string" ? value.replaceAll("\r\n", "\n") : value;

/**
 * Payload of the public contact form. Limits mirror the CHECK constraints of
 * public.contacts, so anything accepted here is also accepted by the database.
 * Unknown keys are stripped instead of rejected: the endpoint is public and a
 * stale client should not get a 400 for sending an extra field.
 */
export const contactPayloadSchema = z.object({
  name: trimmed(100).min(2),
  company: trimmed(120).optional().default(""),
  email: trimmed(160).regex(EMAIL_PATTERN),
  whatsapp: trimmed(40).optional().default(""),
  projectType: trimmed(80).min(2),
  message: z.preprocess(normalizeLineBreaks, trimmed(4000).min(20)),
  /** Honeypot: a real browser leaves it empty, so any value means a bot. */
  website: trimmed(200).optional().default("")
});

export type ContactPayload = z.output<typeof contactPayloadSchema>;

/** Columns `service_role` is allowed to insert (see the grant on public.contacts). */
export type ContactRow = {
  name: string;
  company: string;
  email: string;
  whatsapp: string;
  project_type: string;
  message: string;
  source: string;
};

export function parseContactPayload(
  body: unknown
): { success: true; data: ContactPayload } | { success: false } {
  const result = contactPayloadSchema.safeParse(body);
  // The public endpoint answers with a code, never with validation details.
  return result.success ? { success: true, data: result.data } : { success: false };
}

export function toContactRow(payload: ContactPayload): ContactRow {
  return {
    name: payload.name,
    company: payload.company,
    email: payload.email,
    whatsapp: payload.whatsapp,
    project_type: payload.projectType,
    message: payload.message,
    source: CONTACT_SOURCE
  };
}
