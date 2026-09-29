"use client";

import { useState, type ReactNode } from "react";
import { Send } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";

const projectTypes = ["Automação", "Sistema", "API", "Integração", "Dashboard", "Dados", "Inteligência Artificial", "Consultoria", "Outro"];

/*
 * Os campos de entrada usam `border-white/40`, e não o `border-white/10` do
 * resto da página, por causa do contraste: em 10% de branco a borda fica em
 * torno de 1,4:1 sobre o fundo desta seção, muito abaixo do mínimo de 3:1 que a
 * WCAG exige para o contorno de um controle. Em 40% mede 3,81:1 (medido no
 * navegador, compondo o alpha sobre as camadas reais de fundo).
 *
 * A diferença é proposital: borda decorativa em card não precisa desse mínimo,
 * borda que delimita campo de formulário precisa. Não unifique os dois valores.
 */
const fieldClass =
  "focus-ring rounded-xl border border-white/40 bg-black/25 px-4 py-3.5 text-slate-100 outline-none transition focus:border-blue-400/70";

/**
 * Bloco de campo: rótulo acima, campo, e texto de apoio abaixo.
 *
 * Antes não havia rótulo visível nenhum: os seis campos usavam `placeholder`
 * como rótulo, com `aria-label` para o leitor de tela. Isso resolve a
 * acessibilidade e deixa o problema para quem vê a tela: ao começar a digitar,
 * o texto desaparece e a referência do campo vai com ele — e revisar antes de
 * enviar exige apagar o conteúdo para lembrar o que se pedia ali.
 */
function Field({ label, htmlFor, hint, optional, children }: {
  label: string;
  htmlFor: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-slate-300">
        {label}
        {optional ? <span className="ml-2 font-normal text-slate-500">opcional</span> : null}
      </label>
      {children}
      {hint ? <p id={`${htmlFor}-hint`} className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function Contact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [detail, setDetail] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // React nulls currentTarget once the event handler awaits, so keep the form.
    const form = e.currentTarget;
    setStatus("loading");
    setDetail(null);
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const r = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        setStatus("error");
        setDetail(r.status === 429 ? "Muitas solicitações em pouco tempo. Aguarde um minuto e tente novamente." : null);
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contato" className="section-space bg-white/[.018]">
      <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <SectionHeading
            kicker="Contato"
            title="Conte um pouco sobre o processo que você quer melhorar."
            copy="Quanto mais contexto você enviar, melhor será o diagnóstico inicial. Não precisa definir a tecnologia: descreva o problema, a rotina atual e o resultado esperado."
          />
        </div>

        <form onSubmit={onSubmit} className="card grid gap-5 rounded-3xl p-5 sm:grid-cols-2 sm:p-7">
          <Field label="Nome" htmlFor="contato-nome">
            <input id="contato-nome" name="name" required autoComplete="name" className={fieldClass} />
          </Field>

          <Field label="Empresa" htmlFor="contato-empresa" optional>
            <input id="contato-empresa" name="company" autoComplete="organization" className={fieldClass} />
          </Field>

          <Field label="E-mail" htmlFor="contato-email">
            <input id="contato-email" type="email" name="email" required autoComplete="email" className={fieldClass} />
          </Field>

          <Field label="WhatsApp" htmlFor="contato-whatsapp" optional hint="Com DDD, para retorno mais rápido.">
            <input
              id="contato-whatsapp"
              name="whatsapp"
              type="tel"
              autoComplete="tel"
              aria-describedby="contato-whatsapp-hint"
              className={fieldClass}
            />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Tipo de projeto" htmlFor="contato-tipo">
              <select id="contato-tipo" name="projectType" required defaultValue="" className={`${fieldClass} bg-[#0a101d]`}>
                <option value="" disabled>Selecione</option>
                {projectTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </Field>
          </div>

          {/* Honeypot: campo invisível que só um robô preenche. Nome, atributos e
            * ordem seguem o que a rota /api/contact valida. */}
          <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

          <div className="sm:col-span-2">
            <Field label="Necessidade" htmlFor="contato-necessidade" hint="Mínimo de 20 caracteres.">
              <textarea
                id="contato-necessidade"
                name="message"
                required
                minLength={20}
                rows={6}
                aria-describedby="contato-necessidade-hint"
                className={fieldClass}
              />
            </Field>
          </div>

          <button
            disabled={status === "loading"}
            className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold transition hover:bg-blue-500 active:translate-y-px disabled:opacity-60 sm:col-span-2"
          >
            {status === "loading" ? "Enviando..." : "Enviar solicitação"}
            <Send size={17} aria-hidden="true" />
          </button>

          <p aria-live="polite" className="text-sm sm:col-span-2">
            {status === "success" ? <span className="text-cyan-300">Solicitação enviada com sucesso.</span> : null}
            {status === "error" ? (
              <span className="text-red-300">{detail ?? "Não foi possível enviar agora. Tente novamente ou use o WhatsApp."}</span>
            ) : null}
          </p>
        </form>
      </div>
    </section>
  );
}
