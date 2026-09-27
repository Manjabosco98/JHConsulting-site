import { z } from "zod";
import { SLUG_PATTERN, slugify } from "@/lib/slug";

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres.`);
const order = z.coerce
  .number({ message: "Informe um número." })
  .int("Use um número inteiro.")
  .min(0, "Use 0 ou maior.")
  .max(1_000_000, "Número muito alto.");

/** Empty slug is derived from the name; both must match the database CHECK. */
function resolveSlug(name: string, slug: string, ctx: z.RefinementCtx) {
  const value = slug || slugify(name, 140);
  if (!SLUG_PATTERN.test(value)) {
    ctx.addIssue({ code: "custom", path: ["slug"], message: "Use apenas letras minúsculas, números e hífens." });
    return null;
  }
  return value;
}

// Limits mirror the CHECK constraints of public.technologies.
export const technologyFormSchema = z
  .object({
    name: text(100).min(1, "Informe o nome."),
    slug: text(140).toLowerCase(),
    active: z.boolean(),
    display_order: order
  })
  .transform((data, ctx) => {
    const slug = resolveSlug(data.name, data.slug, ctx);
    return slug === null ? z.NEVER : { ...data, slug };
  });

// Limits mirror public.technology_groups + technology_group_members.
export const technologyGroupFormSchema = z
  .object({
    name: text(100).min(1, "Informe o nome."),
    slug: text(140).toLowerCase(),
    active: z.boolean(),
    display_order: order,
    technology_ids: z
      .array(z.string().uuid("Tecnologia inválida."))
      .max(60, "Selecione no máximo 60 tecnologias.")
      .refine((ids) => new Set(ids).size === ids.length, "Tecnologia repetida.")
  })
  .transform((data, ctx) => {
    const slug = resolveSlug(data.name, data.slug, ctx);
    return slug === null ? z.NEVER : { ...data, slug };
  });

export type TechnologyInput = z.output<typeof technologyFormSchema>;
export type TechnologyGroupInput = z.output<typeof technologyGroupFormSchema>;
export type TechnologyField = keyof z.input<typeof technologyFormSchema>;
export type TechnologyGroupField = keyof z.input<typeof technologyGroupFormSchema>;
export type TechnologyFieldErrors = Partial<Record<TechnologyField, string>>;
export type TechnologyGroupFieldErrors = Partial<Record<TechnologyGroupField, string>>;

function collectErrors<T extends string>(issues: readonly z.core.$ZodIssue[]): Partial<Record<T, string>> {
  const fieldErrors: Partial<Record<T, string>> = {};
  for (const issue of issues) {
    const key = issue.path[0] as T | undefined;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function parseTechnologyForm(formData: FormData):
  | { success: true; data: TechnologyInput }
  | { success: false; fieldErrors: TechnologyFieldErrors } {
  const result = technologyFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    active: formData.get("active") === "on",
    display_order: String(formData.get("display_order") ?? "") || "0"
  });
  return result.success
    ? { success: true, data: result.data }
    : { success: false, fieldErrors: collectErrors<TechnologyField>(result.error.issues) };
}

export function parseTechnologyGroupForm(formData: FormData):
  | { success: true; data: TechnologyGroupInput }
  | { success: false; fieldErrors: TechnologyGroupFieldErrors } {
  const result = technologyGroupFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    active: formData.get("active") === "on",
    display_order: String(formData.get("display_order") ?? "") || "0",
    technology_ids: formData.getAll("technology_ids").map(String)
  });
  return result.success
    ? { success: true, data: result.data }
    : { success: false, fieldErrors: collectErrors<TechnologyGroupField>(result.error.issues) };
}
