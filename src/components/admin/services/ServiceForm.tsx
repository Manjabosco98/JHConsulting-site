"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import type { ServiceFormState } from "@/app/admin/(painel)/servicos/actions";
import type { ServiceField } from "@/lib/validation/service";
import { serviceIconNames, serviceIcons, type ServiceIconName } from "@/lib/services/icons";
import { slugify } from "@/lib/slug";

export type ServiceFormValues = {
  title: string;
  slug: string;
  description: string;
  icon: ServiceIconName;
  tech: string;
  display_order: string;
  active: boolean;
};

type Props = {
  action: (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;
  initialValues: ServiceFormValues;
  isNew: boolean;
};

const initialState: ServiceFormState = { status: "idle", message: null, fieldErrors: {} };
const inputClass = "focus-ring w-full rounded-xl border border-white/10 bg-black/15 px-4 py-3 outline-none aria-[invalid=true]:border-red-400/60";

function Field({ name, label, hint, error, children }: {
  name: ServiceField; label: string; hint?: string; error?: string; children: React.ReactNode;
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

export function ServiceForm({ action, initialValues, isNew }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [values, setValues] = useState(initialValues);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const errors = state.fieldErrors;

  const set = <K extends keyof ServiceFormValues>(key: K, value: ServiceFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));
  const text = (name: ServiceField & keyof ServiceFormValues) => ({
    id: name,
    name,
    value: values[name] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(name, event.target.value),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : `${name}-hint`
  });

  return (
    <form action={formAction} data-form="service" className="grid gap-6" noValidate>
      <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Identificação</legend>
        <h2 aria-hidden="true" className="font-black">Identificação</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field name="title" label="Título" error={errors.title}>
            <input {...text("title")} required maxLength={160}
              onChange={(event) => {
                const title = event.target.value;
                setValues((current) => ({ ...current, title, slug: slugTouched ? current.slug : slugify(title) }));
              }} className={inputClass} />
          </Field>
          <Field name="slug" label="Slug" hint="Identificador único. Vazio = gerado pelo título." error={errors.slug}>
            <input {...text("slug")} maxLength={180}
              onChange={(event) => { setSlugTouched(true); set("slug", event.target.value); }} className={inputClass} />
          </Field>
        </div>
        <Field name="description" label="Descrição" hint="Texto exibido no card do serviço." error={errors.description}>
          <textarea {...text("description")} required rows={3} maxLength={5000} className={inputClass} />
        </Field>
        <Field name="tech" label="Linha de tecnologias" hint="Rodapé editorial do card, ex.: Python • Playwright • APIs." error={errors.tech}>
          <input {...text("tech")} maxLength={500} className={inputClass} />
        </Field>
      </fieldset>

      <fieldset className="card grid gap-4 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Ícone</legend>
        <h2 aria-hidden="true" className="font-black">Ícone</h2>
        <input type="hidden" name="icon" value={values.icon} />
        <div role="radiogroup" aria-label="Ícone do serviço" className="flex flex-wrap gap-2">
          {serviceIconNames.map((name) => {
            const Icon = serviceIcons[name];
            const selected = values.icon === name;
            return (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={name}
                title={name}
                onClick={() => set("icon", name)}
                className={`focus-ring grid h-11 w-11 place-items-center rounded-xl border transition-colors ${
                  selected ? "border-blue-400/50 bg-blue-500/15 text-blue-200" : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <Icon size={20} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-500">Selecionado: {values.icon}</p>
        {errors.icon ? <p className="text-sm text-red-300">{errors.icon}</p> : null}
      </fieldset>

      <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Exibição</legend>
        <h2 aria-hidden="true" className="font-black">Exibição</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="display_order" label="Ordem de exibição" hint="Menor aparece primeiro." error={errors.display_order}>
            <input {...text("display_order")} type="number" min={0} step={1} inputMode="numeric" className={inputClass} />
          </Field>
          <label className="flex items-center gap-3 self-center text-sm font-bold text-slate-300">
            <input type="checkbox" name="active" checked={values.active} onChange={(event) => set("active", event.target.checked)}
              className="focus-ring h-5 w-5 accent-blue-500" />
            Ativo (aparece no site)
          </label>
        </div>
      </fieldset>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-white/10 bg-[#080d18]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="font-bold">
          <button disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 hover:bg-blue-500 disabled:opacity-60">
            {pending ? "Salvando..." : isNew ? "Criar serviço" : "Salvar alterações"} <Save size={16} aria-hidden="true" />
          </button>
        </div>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {pending ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
