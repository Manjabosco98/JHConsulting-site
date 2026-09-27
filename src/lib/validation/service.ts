import { z } from "zod";
import { SLUG_PATTERN, slugify } from "@/lib/slug";
import { serviceIconNames } from "@/lib/services/icons";

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres.`);

// Limits mirror the CHECK constraints of public.services.
export const serviceFormSchema = z
  .object({
    title: text(160).min(1, "Informe o título."),
    slug: text(180).toLowerCase(),
    description: text(5000).min(1, "Informe a descrição."),
    icon: z.enum(serviceIconNames as [string, ...string[]], { message: "Escolha um ícone da lista." }),
    tech: text(500),
    display_order: z.coerce
      .number({ message: "Informe um número." })
      .int("Use um número inteiro.")
      .min(0, "Use 0 ou maior.")
      .max(1_000_000, "Número muito alto."),
    active: z.boolean()
  })
  .transform((data, ctx) => {
    const slug = data.slug || slugify(data.title);
    if (!SLUG_PATTERN.test(slug)) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: "Use apenas letras minúsculas, números e hífens." });
      return z.NEVER;
    }
    return { ...data, slug };
  });

export type ServiceInput = z.output<typeof serviceFormSchema>;
export type ServiceField = keyof z.input<typeof serviceFormSchema>;
export type ServiceFieldErrors = Partial<Record<ServiceField, string>>;

export function readServiceForm(formData: FormData) {
  // Forms submit textarea line breaks as CRLF; store a single convention.
  const field = (name: string) => String(formData.get(name) ?? "").replaceAll("\r\n", "\n");
  return {
    title: field("title"),
    slug: field("slug"),
    description: field("description"),
    icon: field("icon"),
    tech: field("tech"),
    display_order: field("display_order") || "0",
    active: formData.get("active") === "on"
  };
}

export function parseServiceForm(formData: FormData):
  | { success: true; data: ServiceInput }
  | { success: false; fieldErrors: ServiceFieldErrors } {
  const result = serviceFormSchema.safeParse(readServiceForm(formData));
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: ServiceFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as ServiceField | undefined;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}
