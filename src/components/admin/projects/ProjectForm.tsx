"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Save, X } from "lucide-react";
import type { ProjectFormState } from "@/app/admin/(painel)/projetos/actions";
import type { TechnologyOption } from "@/lib/repositories/projects";
import type { ProjectField, ProjectVisibility } from "@/lib/validation/project";
import { slugify } from "@/lib/slug";

export type ProjectFormValues = {
  title: string;
  slug: string;
  category: string;
  status: string;
  short_description: string;
  description: string;
  problem: string;
  solution: string;
  repository_url: string;
  demo_url: string;
  featured: boolean;
  display_order: string;
  visibility: ProjectVisibility;
  technology_ids: string[];
};

type Props = {
  action: (state: ProjectFormState, formData: FormData) => Promise<ProjectFormState>;
  initialValues: ProjectFormValues;
  isNew: boolean;
  technologies: TechnologyOption[];
  suggestions: { categories: string[]; labels: string[] };
};

const initialState: ProjectFormState = { status: "idle", message: null, fieldErrors: {} };
const inputClass = "focus-ring w-full rounded-xl border border-white/10 bg-black/15 px-4 py-3 outline-none aria-[invalid=true]:border-red-400/60";

const visibilityOptions: { value: ProjectVisibility; label: string; hint: string }[] = [
  { value: "draft", label: "Rascunho", hint: "Visível só no painel." },
  { value: "published", label: "Publicado", hint: "Aparece no site." },
  { value: "archived", label: "Arquivado", hint: "Fora do site, mantido no histórico." }
];

function Field({ name, label, hint, error, children }: {
  name: ProjectField; label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-2">
      <label htmlFor={name} className="text-sm font-bold text-slate-300">{label}</label>
      {children}
      {error ? <p id={`${name}-error`} className="text-sm text-red-300">{error}</p>
        : hint ? <p id={`${name}-hint`} className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 aria-hidden="true" className="font-black">{title}</h2>
      {children}
    </fieldset>
  );
}

export function ProjectForm({ action, initialValues, isNew, technologies, suggestions }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [values, setValues] = useState(initialValues);
  // New projects follow the title until the slug is edited by hand.
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const errors = state.fieldErrors;

  const set = <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const text = (name: ProjectField & keyof ProjectFormValues) => ({
    id: name,
    name,
    value: values[name] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(name, event.target.value),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : `${name}-hint`
  });

  const technologyName = new Map(technologies.map((tech) => [tech.id, tech.name]));
  const toggleTechnology = (id: string) =>
    set("technology_ids", values.technology_ids.includes(id)
      ? values.technology_ids.filter((current) => current !== id)
      : [...values.technology_ids, id]);
  const moveTechnology = (index: number, offset: number) => {
    const next = [...values.technology_ids];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    set("technology_ids", next);
  };

  return (
    <form action={formAction} data-form="project" className="grid gap-6" noValidate>
      <Section title="Identificação">
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="title" label="Título" error={errors.title}>
            <input {...text("title")} required maxLength={160}
              onChange={(event) => {
                const title = event.target.value;
                setValues((current) => ({ ...current, title, slug: slugTouched ? current.slug : slugify(title) }));
              }} className={inputClass} />
          </Field>
          <Field name="slug" label="Slug (endereço)" hint="Usado na URL pública do projeto. Vazio = gerado pelo título." error={errors.slug}>
            <input {...text("slug")} maxLength={180}
              onChange={(event) => { setSlugTouched(true); set("slug", event.target.value); }} className={inputClass} />
          </Field>
          <Field name="category" label="Categoria" error={errors.category}>
            <input {...text("category")} required maxLength={120} list="project-categories" className={inputClass} />
          </Field>
          <Field name="status" label="Rótulo editorial" hint="Exibido no card, ex.: Case técnico." error={errors.status}>
            <input {...text("status")} maxLength={80} list="project-labels" className={inputClass} />
          </Field>
        </div>
        <datalist id="project-categories">{suggestions.categories.map((value) => <option key={value} value={value} />)}</datalist>
        <datalist id="project-labels">{suggestions.labels.map((value) => <option key={value} value={value} />)}</datalist>
      </Section>

      <Section title="Conteúdo">
        <Field name="short_description" label="Resumo" hint="Frase curta para listagens e SEO (até 500 caracteres)." error={errors.short_description}>
          <textarea {...text("short_description")} rows={2} maxLength={500} className={inputClass} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="problem" label="Problema" error={errors.problem}>
            <textarea {...text("problem")} rows={4} maxLength={15000} className={inputClass} />
          </Field>
          <Field name="solution" label="Solução" error={errors.solution}>
            <textarea {...text("solution")} rows={4} maxLength={15000} className={inputClass} />
          </Field>
        </div>
        <Field name="description" label="Descrição completa" hint="Texto da página do projeto. Separe parágrafos com uma linha em branco." error={errors.description}>
          <textarea {...text("description")} rows={8} maxLength={30000} className={inputClass} />
        </Field>
      </Section>

      <Section title="Tecnologias">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Tecnologias disponíveis">
          {technologies.map((tech) => {
            const checked = values.technology_ids.includes(tech.id);
            return (
              <label key={tech.id} className={`focus-within:ring-2 focus-within:ring-blue-400 cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-bold ${
                checked ? "border-blue-400/50 bg-blue-500/15 text-blue-100" : "border-white/10 text-slate-400 hover:text-slate-200"}`}>
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleTechnology(tech.id)} />
                {tech.name}{tech.active ? "" : " (inativa)"}
              </label>
            );
          })}
        </div>
        {values.technology_ids.length ? (
          <div>
            <p className="text-sm font-bold text-slate-300">Ordem no card</p>
            <ol className="mt-2 grid gap-1.5 sm:max-w-md">
              {values.technology_ids.map((id, index) => (
                <li key={id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm">
                  <span className="w-5 text-slate-500">{index + 1}.</span>
                  <span className="mr-auto">{technologyName.get(id) ?? "Tecnologia removida"}</span>
                  <button type="button" aria-label="Mover para cima" disabled={index === 0} onClick={() => moveTechnology(index, -1)} className="focus-ring rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"><ArrowUp size={14} /></button>
                  <button type="button" aria-label="Mover para baixo" disabled={index === values.technology_ids.length - 1} onClick={() => moveTechnology(index, 1)} className="focus-ring rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"><ArrowDown size={14} /></button>
                  <button type="button" aria-label="Remover" onClick={() => toggleTechnology(id)} className="focus-ring rounded p-1 text-slate-400 hover:text-red-300"><X size={14} /></button>
                  <input type="hidden" name="technology_ids" value={id} />
                </li>
              ))}
            </ol>
          </div>
        ) : <p className="text-sm text-slate-500">Nenhuma tecnologia selecionada.</p>}
        {errors.technology_ids ? <p className="text-sm text-red-300">{errors.technology_ids}</p> : null}
      </Section>

      <Section title="Links">
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="repository_url" label="Repositório" hint="Opcional." error={errors.repository_url}>
            <input {...text("repository_url")} type="url" inputMode="url" placeholder="https://github.com/..." className={inputClass} />
          </Field>
          <Field name="demo_url" label="Demonstração" hint="Opcional." error={errors.demo_url}>
            <input {...text("demo_url")} type="url" inputMode="url" placeholder="https://..." className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Publicação">
        <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Situação">
          {visibilityOptions.map((option) => (
            <label key={option.value} className={`focus-within:ring-2 focus-within:ring-blue-400 cursor-pointer rounded-xl border p-4 ${
              values.visibility === option.value ? "border-blue-400/50 bg-blue-500/10" : "border-white/10 hover:bg-white/5"}`}>
              <input type="radio" name="visibility" value={option.value} className="sr-only"
                checked={values.visibility === option.value} onChange={() => set("visibility", option.value)} />
              <span className="block font-bold">{option.label}</span>
              <span className="mt-1 block text-xs text-slate-400">{option.hint}</span>
            </label>
          ))}
        </div>
        {errors.visibility ? <p className="text-sm text-red-300">{errors.visibility}</p> : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="display_order" label="Ordem de exibição" hint="Menor aparece primeiro." error={errors.display_order}>
            <input {...text("display_order")} type="number" min={0} step={1} inputMode="numeric" className={inputClass} />
          </Field>
          <label className="flex items-center gap-3 self-center text-sm font-bold text-slate-300">
            <input type="checkbox" name="featured" checked={values.featured} onChange={(event) => set("featured", event.target.checked)}
              className="focus-ring h-5 w-5 accent-blue-500" />
            Projeto em destaque
          </label>
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-white/10 bg-[#080d18]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="font-bold">
          <button disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 hover:bg-blue-500 disabled:opacity-60">
            {pending ? "Salvando..." : isNew ? "Criar projeto" : "Salvar alterações"} <Save size={16} aria-hidden="true" />
          </button>
        </div>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {pending ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
