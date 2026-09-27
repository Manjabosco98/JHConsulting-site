"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import type { TechnologyFormState } from "@/app/admin/(painel)/tecnologias/actions";
import type { TechnologyField } from "@/lib/validation/technology";
import { slugify } from "@/lib/slug";

export type TechnologyFormValues = { name: string; slug: string; active: boolean; display_order: string };

type Props = {
  action: (state: TechnologyFormState, formData: FormData) => Promise<TechnologyFormState>;
  initialValues: TechnologyFormValues;
  isNew: boolean;
};

const initialState: TechnologyFormState = { status: "idle", message: null, fieldErrors: {} };
const inputClass = "focus-ring w-full rounded-xl border border-white/10 bg-black/15 px-4 py-3 outline-none aria-[invalid=true]:border-red-400/60";

function FieldError({ name, message }: { name: string; message?: string }) {
  return message ? <p id={`${name}-error`} className="text-sm text-red-300">{message}</p> : null;
}

export function TechnologyForm({ action, initialValues, isNew }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [values, setValues] = useState(initialValues);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const errors = state.fieldErrors;

  const field = (name: TechnologyField & ("name" | "slug" | "display_order")) => ({
    id: name,
    name,
    value: values[name],
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined
  });

  return (
    <form action={formAction} data-form="technology" className="grid gap-6" noValidate>
      <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Tecnologia</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="grid content-start gap-2">
            <label htmlFor="name" className="text-sm font-bold text-slate-300">Nome</label>
            <input {...field("name")} required maxLength={100} className={inputClass}
              onChange={(event) => {
                const name = event.target.value;
                setValues((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name, 140) }));
              }} />
            <FieldError name="name" message={errors.name} />
          </div>
          <div className="grid content-start gap-2">
            <label htmlFor="slug" className="text-sm font-bold text-slate-300">Slug</label>
            <input {...field("slug")} maxLength={140} className={inputClass}
              onChange={(event) => { setSlugTouched(true); setValues((c) => ({ ...c, slug: event.target.value })); }} />
            {errors.slug ? <FieldError name="slug" message={errors.slug} /> : <p className="text-xs text-slate-500">Identificador único. Vazio = gerado pelo nome.</p>}
          </div>
          <div className="grid content-start gap-2">
            <label htmlFor="display_order" className="text-sm font-bold text-slate-300">Ordem de exibição</label>
            <input {...field("display_order")} type="number" min={0} step={1} inputMode="numeric" className={inputClass}
              onChange={(event) => setValues((c) => ({ ...c, display_order: event.target.value }))} />
            {errors.display_order ? <FieldError name="display_order" message={errors.display_order} /> : <p className="text-xs text-slate-500">Usada quando a tecnologia é listada fora de um grupo.</p>}
          </div>
          <label className="flex items-center gap-3 self-center text-sm font-bold text-slate-300">
            <input type="checkbox" name="active" checked={values.active}
              onChange={(event) => setValues((c) => ({ ...c, active: event.target.checked }))}
              className="focus-ring h-5 w-5 accent-blue-500" />
            Ativa (aparece no site)
          </label>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4">
        <div className="font-bold">
          <button disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 hover:bg-blue-500 disabled:opacity-60">
            {pending ? "Salvando..." : isNew ? "Criar tecnologia" : "Salvar alterações"} <Save size={16} aria-hidden="true" />
          </button>
        </div>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {pending ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
