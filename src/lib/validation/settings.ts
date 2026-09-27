import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres.`);
const required = (max: number, message: string) => text(max).min(1, message);

/** Empty optional fields are stored as NULL, not as an empty string. */
const optionalText = (max: number) => text(max).transform((value) => value || null);

const optionalUrl = (label: string) =>
  text(2048)
    .refine(
      (value) => value === "" || (/^https?:\/\/\S+$/.test(value) && URL.canParse(value)),
      `Informe a URL completa do ${label}, começando com https://.`
    )
    .transform((value) => value || null);

// Limits and formats mirror the CHECK constraints of public.site_settings.
export const settingsFormSchema = z.object({
  company_name: required(160, "Informe o nome da empresa."),
  professional_name: required(160, "Informe o nome do profissional."),
  role: required(250, "Informe o cargo."),
  description: required(4000, "Informe a descrição."),
  bio: text(20000),
  email: optionalText(160).refine(
    (value) => value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Informe um e-mail válido."
  ),
  phone: optionalText(40),
  whatsapp: optionalText(40).refine(
    (value) => value === null || value.replace(/\D/g, "").length >= 10,
    "Informe o número com DDD (e DDI, se for o caso)."
  ),
  linkedin_url: optionalUrl("LinkedIn"),
  github_url: optionalUrl("GitHub"),
  instagram_url: optionalUrl("Instagram"),
  location: required(250, "Informe a localização."),
  service_area: required(500, "Informe a área de atendimento.")
});

export type SettingsInput = z.output<typeof settingsFormSchema>;
export type SettingsField = keyof z.input<typeof settingsFormSchema>;
export type SettingsFieldErrors = Partial<Record<SettingsField, string>>;

export const settingsTextFields = [
  "company_name", "professional_name", "role", "description", "bio",
  "email", "phone", "whatsapp", "linkedin_url", "github_url", "instagram_url",
  "location", "service_area"
] as const satisfies readonly SettingsField[];

/** Forms submit textarea line breaks as CRLF; store a single convention. */
const readText = (formData: FormData, field: string) =>
  String(formData.get(field) ?? "").replaceAll("\r\n", "\n");

export function parseSettingsForm(formData: FormData):
  | { success: true; data: SettingsInput }
  | { success: false; fieldErrors: SettingsFieldErrors } {
  const values = Object.fromEntries(settingsTextFields.map((field) => [field, readText(formData, field)]));
  const result = settingsFormSchema.safeParse(values);
  if (result.success) return { success: true, data: result.data };

  const fieldErrors: SettingsFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as SettingsField | undefined;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}
