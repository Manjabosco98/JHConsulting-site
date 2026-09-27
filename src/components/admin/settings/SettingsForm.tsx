"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import type { SettingsFormState } from "@/app/admin/(painel)/configuracoes/actions";
import type { SettingsField } from "@/lib/validation/settings";

export type SettingsFormValues = Record<SettingsField, string>;

type Props = {
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
  initialValues: SettingsFormValues;
};

const initialState: SettingsFormState = { status: "idle", message: null, fieldErrors: {} };
const inputClass = "focus-ring w-full rounded-xl border border-white/10 bg-black/15 px-4 py-3 outline-none aria-[invalid=true]:border-red-400/60";

function Row({ name, label, hint, error, children }: {
  name: SettingsField; label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-2">
      <label htmlFor={name} className="text-sm font-bold text-slate-300">{label}</label>
      {children}
      {error
        ? <p id={`${name}-error`} className="text-sm text-red-300">{error}</p>
        : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function SettingsForm({ action, initialValues }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [values, setValues] = useState(initialValues);
  const errors = state.fieldErrors;

  const bind = (name: SettingsField) => ({
    id: name,
    name,
    value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((current) => ({ ...current, [name]: event.target.value })),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: inputClass
  });

  return (
    <form action={formAction} data-form="settings" className="grid gap-6" noValidate>
      <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Identidade</legend>
        <h2 aria-hidden="true" className="font-black">Identidade</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Row name="company_name" label="Nome da empresa" error={errors.company_name}>
            <input {...bind("company_name")} required maxLength={160} />
          </Row>
          <Row name="professional_name" label="Nome do profissional" error={errors.professional_name}>
            <input {...bind("professional_name")} required maxLength={160} />
          </Row>
          <Row name="role" label="Cargo" hint="Exibido abaixo do nome no topo do site." error={errors.role}>
            <input {...bind("role")} required maxLength={250} />
          </Row>
          <Row name="description" label="Descrição curta" hint="Usada em metadados e compartilhamento." error={errors.description}>
            <textarea {...bind("description")} required rows={3} maxLength={4000} />
          </Row>
        </div>
        <Row name="bio" label="Sobre (bio)" hint="Texto da seção Sobre. Separe parágrafos com uma linha em branco." error={errors.bio}>
          <textarea {...bind("bio")} rows={8} maxLength={20000} />
        </Row>
      </fieldset>

      <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Contato</legend>
        <h2 aria-hidden="true" className="font-black">Contato público</h2>
        <p className="text-sm text-slate-400">Campos vazios simplesmente não aparecem no site. O e-mail de envio do formulário continua em variável de ambiente.</p>
        <div className="grid gap-5 md:grid-cols-2">
          <Row name="email" label="E-mail" hint="Vira o link de e-mail no rodapé." error={errors.email}>
            <input {...bind("email")} type="email" inputMode="email" maxLength={160} placeholder="contato@exemplo.com.br" />
          </Row>
          <Row name="whatsapp" label="WhatsApp" hint="Com DDI e DDD, ex.: 55 62 90000-0000." error={errors.whatsapp}>
            <input {...bind("whatsapp")} inputMode="tel" maxLength={40} placeholder="55 62 90000-0000" />
          </Row>
          <Row name="phone" label="Telefone (opcional)" hint="Apenas informativo; não gera link." error={errors.phone}>
            <input {...bind("phone")} inputMode="tel" maxLength={40} />
          </Row>
          <Row name="location" label="Localização" hint="Cidade, estado, país. Também usada no Schema.org." error={errors.location}>
            <input {...bind("location")} required maxLength={250} />
          </Row>
          <Row name="service_area" label="Área de atendimento" error={errors.service_area}>
            <input {...bind("service_area")} required maxLength={500} />
          </Row>
        </div>
      </fieldset>

      <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Redes sociais</legend>
        <h2 aria-hidden="true" className="font-black">Redes sociais</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Row name="linkedin_url" label="LinkedIn" error={errors.linkedin_url}>
            <input {...bind("linkedin_url")} type="url" inputMode="url" maxLength={2048} placeholder="https://www.linkedin.com/in/..." />
          </Row>
          <Row name="github_url" label="GitHub" error={errors.github_url}>
            <input {...bind("github_url")} type="url" inputMode="url" maxLength={2048} placeholder="https://github.com/..." />
          </Row>
          <Row name="instagram_url" label="Instagram" error={errors.instagram_url}>
            <input {...bind("instagram_url")} type="url" inputMode="url" maxLength={2048} placeholder="https://www.instagram.com/..." />
          </Row>
        </div>
      </fieldset>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-white/10 bg-[#080d18]/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="font-bold">
          <button disabled={pending} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 hover:bg-blue-500 disabled:opacity-60">
            {pending ? "Salvando..." : "Salvar configurações"} <Save size={16} aria-hidden="true" />
          </button>
        </div>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {pending ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
