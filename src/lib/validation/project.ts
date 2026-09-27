import { z } from "zod";
import { SLUG_PATTERN, slugify } from "@/lib/slug";

export const projectVisibilities = ["draft", "published", "archived"] as const;
export type ProjectVisibility = (typeof projectVisibilities)[number];

const optionalHttpUrl = z
  .string()
  .trim()
  .max(2048, "Máximo de 2048 caracteres.")
  .refine(
    (value) => value === "" || (/^https?:\/\/\S+$/.test(value) && URL.canParse(value)),
    "Informe uma URL completa, começando com http:// ou https://."
  );

const text = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres.`);

// Limits mirror the CHECK constraints of public.projects.
export const projectFormSchema = z
  .object({
    title: text(160).min(1, "Informe o título."),
    slug: text(180).toLowerCase(),
    category: text(120).min(1, "Informe a categoria."),
    status: text(80),
    short_description: text(500),
    description: text(30000),
    problem: text(15000),
    solution: text(15000),
    repository_url: optionalHttpUrl,
    demo_url: optionalHttpUrl,
    featured: z.boolean(),
    display_order: z.coerce
      .number({ message: "Informe um número." })
      .int("Use um número inteiro.")
      .min(0, "Use 0 ou maior.")
      .max(1_000_000, "Número muito alto."),
    visibility: z.enum(projectVisibilities, { message: "Escolha a situação do projeto." }),
    technology_ids: z
      .array(z.string().uuid("Tecnologia inválida."))
      .max(30, "Selecione no máximo 30 tecnologias.")
      .refine((ids) => new Set(ids).size === ids.length, "Tecnologia repetida.")
  })
  .transform((data, ctx) => {
    // Empty slug → derived from the title.
    const slug = data.slug || slugify(data.title);
    if (!SLUG_PATTERN.test(slug)) {
      ctx.addIssue({ code: "custom", path: ["slug"], message: "Use apenas letras minúsculas, números e hífens." });
      return z.NEVER;
    }
    return { ...data, slug };
  });

export type ProjectInput = z.output<typeof projectFormSchema>;
export type ProjectField = keyof z.input<typeof projectFormSchema>;
export type ProjectFieldErrors = Partial<Record<ProjectField, string>>;

export function readProjectForm(formData: FormData) {
  const field = (name: string) => String(formData.get(name) ?? "");
  return {
    title: field("title"),
    slug: field("slug"),
    category: field("category"),
    status: field("status"),
    short_description: field("short_description"),
    description: field("description"),
    problem: field("problem"),
    solution: field("solution"),
    repository_url: field("repository_url"),
    demo_url: field("demo_url"),
    featured: formData.get("featured") === "on",
    display_order: field("display_order") || "0",
    visibility: field("visibility"),
    technology_ids: formData.getAll("technology_ids").map(String)
  };
}

export function parseProjectForm(formData: FormData):
  | { success: true; data: ProjectInput }
  | { success: false; fieldErrors: ProjectFieldErrors } {
  const result = projectFormSchema.safeParse(readProjectForm(formData));
  if (result.success) return { success: true, data: result.data };
  const fieldErrors: ProjectFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as ProjectField | undefined;
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { success: false, fieldErrors };
}
