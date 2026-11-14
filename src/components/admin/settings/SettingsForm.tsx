"use client";

import { useActionState, useState } from "react";
import { ChevronDown, Save } from "lucide-react";
import type { SettingsFormState } from "@/app/admin/(painel)/configuracoes/actions";
import type { SettingsField } from "@/lib/validation/settings";

export type SettingsFormValues = Record<SettingsField, string>;
type Props = { action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>; initialValues: SettingsFormValues };
const initialState: SettingsFormState = { status: "idle", message: null, fieldErrors: {} };
const inputClass = "focus-ring w-full rounded-xl border border-white/30 bg-midnight/30 px-4 py-3 leading-6 text-slate-100 outline-none transition focus:border-blue-400/70 aria-[invalid=true]:border-red-400/60";

function Row({ name, label, hint, error, children }: { name: SettingsField; label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="grid content-start gap-2">
      <label htmlFor={name} className="text-sm font-semibold text-slate-200">{label}</label>
      {children}
      {error ? <p id={`${name}-error`} className="text-sm text-red-300">{error}</p> : hint ? <p className="text-xs leading-6 text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function SettingsForm({ action, initialValues }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [values, setValues] = useState(initialValues);
  const errors = state.fieldErrors;
  const bind = (name: SettingsField) => ({
    id: name, name, value: values[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((current) => ({ ...current, [name]: event.target.value })),
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: inputClass
  });
  return (
    <form action={formAction} data-form="settings" className="grid gap-6" noValidate>
      <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Empresa e apresentação</legend>
        <div><h2 className="font-bold">Empresa e apresentação</h2><p className="mt-2 text-sm leading-7 text-slate-400">Informações usadas nos títulos, na descrição para buscadores e no compartilhamento do site.</p></div>
        <Row name="company_name" label="Nome da empresa" hint="Atualiza os títulos e o copyright. A logo mantém a identidade visual da marca." error={errors.company_name}><input {...bind("company_name")} required maxLength={160} /></Row>
        <Row name="description" label="Descrição curta" hint="Apresente a atuação e os serviços da empresa em poucas palavras." error={errors.description}><textarea {...bind("description")} required rows={3} maxLength={4000} /></Row>
      </fieldset>

      <fieldset className="card grid gap-5 rounded-2xl p-5 sm:p-6">
        <legend className="sr-only">Contato e atendimento</legend>
        <div><h2 className="font-bold">Contato e atendimento</h2><p className="mt-2 text-sm leading-7 text-slate-400">Mantenha os canais comerciais e a área de atendimento atualizados. Contatos opcionais vazios não aparecem no site.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <Row name="email" label="E-mail" hint="Exibido no contato comercial do rodapé." error={errors.email}><input {...bind("email")} type="email" inputMode="email" maxLength={160} placeholder="contato@exemplo.com.br" /></Row>
          <Row name="whatsapp" label="WhatsApp" hint="Inclua DDI e DDD, por exemplo: 55 62 90000-0000." error={errors.whatsapp}><input {...bind("whatsapp")} inputMode="tel" maxLength={40} placeholder="55 62 90000-0000" /></Row>
          <Row name="location" label="Localização" hint="Cidade, estado e país." error={errors.location}><input {...bind("location")} required maxLength={250} /></Row>
          <Row name="service_area" label="Área de atendimento" error={errors.service_area}><input {...bind("service_area")} required maxLength={500} /></Row>
          <Row name="phone" label="Telefone (opcional)" hint="Informação de cadastro; não é exibida na página pública." error={errors.phone}><input {...bind("phone")} inputMode="tel" maxLength={40} /></Row>
        </div>
      </fieldset>

      <details className="card group rounded-2xl p-5 sm:p-6" open={Boolean(errors.professional_name || errors.role || errors.bio) || undefined}>
        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded text-sm font-semibold text-slate-300 [&::-webkit-details-marker]:hidden">Informações anteriores do responsável<ChevronDown size={17} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
        <p className="mt-4 text-sm leading-7 text-slate-400">Dados preservados para consulta interna. Não aparecem no site empresarial.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Row name="professional_name" label="Nome do responsável" error={errors.professional_name}><input {...bind("professional_name")} required maxLength={160} /></Row>
          <Row name="role" label="Cargo" error={errors.role}><input {...bind("role")} required maxLength={250} /></Row>
        </div>
        <div className="mt-5"><Row name="bio" label="Biografia anterior" error={errors.bio}><textarea {...bind("bio")} rows={6} maxLength={20000} /></Row></div>
      </details>

      <details className="card group rounded-2xl p-5 sm:p-6" open={Boolean(errors.linkedin_url || errors.github_url || errors.instagram_url) || undefined}>
        <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded text-sm font-semibold text-slate-300 [&::-webkit-details-marker]:hidden">Redes sociais anteriores<ChevronDown size={17} className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary>
        <p className="mt-4 text-sm leading-7 text-slate-400">Links preservados para consulta. Os canais comerciais acima são os usados pelo site.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Row name="linkedin_url" label="LinkedIn" error={errors.linkedin_url}><input {...bind("linkedin_url")} type="url" inputMode="url" maxLength={2048} /></Row>
          <Row name="github_url" label="GitHub" error={errors.github_url}><input {...bind("github_url")} type="url" inputMode="url" maxLength={2048} /></Row>
          <Row name="instagram_url" label="Instagram" error={errors.instagram_url}><input {...bind("instagram_url")} type="url" inputMode="url" maxLength={2048} /></Row>
        </div>
      </details>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-white/10 bg-navy/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="text-sm font-bold"><button disabled={pending} className="btn-primary focus-ring inline-flex items-center gap-2 rounded-xl px-5 py-3 disabled:opacity-60">{pending ? "Salvando..." : "Salvar configurações"}<Save size={16} aria-hidden="true" /></button></div>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-300" : "text-cyan-300"}`}>{pending ? "" : state.message}</p>
      </div>
    </form>
  );
}
