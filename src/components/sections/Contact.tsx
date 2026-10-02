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
/*
 * `leading-6` mais `min-h` fecham a altura dos controles em 54px.
 *
 * Sem altura de linha declarada, cada campo resolvia pela métrica da fonte, e o
 * <select> ficava 1px mais baixo que as cinco caixas de texto. `leading-6`
 * resolve os <input>, mas não o <select>: o Chrome ignora `line-height` em
 * select nativo (a folha de estilo do próprio navegador tem precedência ali, para
 * não quebrar a lista aberta), e ele continuava em 53px. Daí a altura mínima
 * explícita, que é o único jeito de igualar os dois — 14px de recuo em cima e
 * embaixo, 24px de linha e 1px de borda de cada lado dão exatamente 3,375rem.
 */
const fieldClass =
  "focus-ring min-h-[3.375rem] rounded-xl border border-white/40 bg-black/25 px-4 py-3.5 leading-6 text-slate-100 outline-none transition focus:border-blue-400/70";

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
    /*
     * `content-start` é o que mantém os campos alinhados entre si.
     *
     * Cada bloco é uma grade, e duas delas dividem a linha do formulário em `sm`.
     * "WhatsApp" tem texto de apoio embaixo e por isso é 24px mais alto que
     * "E-mail"; a linha assume a altura do mais alto e estica o menor. Sem esta
     * regra, o padrão `align-content: stretch` reparte esses 24px entre as linhas
     * internas do bloco esticado, e o resultado medido era um campo de e-mail com
     * 66px ao lado de um campo de nome com 54px, com o rótulo deslocado 12px para
     * baixo. Com o alinhamento no topo, a sobra fica embaixo do bloco e os seis
     * controles medem igual.
     */
    <div className="group grid content-start gap-2">
      <label htmlFor={htmlFor} className="text-sm font-bold text-slate-300 transition-colors group-focus-within:text-blue-200">
        {label}
        {/* `slate-400` e não `slate-500`: #64748b sobre o fundo desta seção mede
          * 4,08:1, abaixo do mínimo de 4,5:1 da WCAG AA para texto pequeno. */}
        {optional ? <span className="ml-2 font-normal text-slate-400">opcional</span> : null}
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
    <section id="contato" className="section-space border-t border-blue-400/5 bg-white/[.018]">
      <div className="container-shell grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-14">
        <div>
          <SectionHeading
            kicker="Contato"
            title="Conte um pouco sobre o processo que você quer melhorar."
            copy="Quanto mais contexto você enviar, melhor será o diagnóstico inicial. Não precisa definir a tecnologia: descreva o problema, a rotina atual e o resultado esperado."
          />
        </div>

        <form onSubmit={onSubmit} className="grid gap-5 border-t border-blue-400/20 pt-7 sm:grid-cols-2">
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
              {/*
                * O `bg-[#0a101d]` que existia aqui saiu: era uma tentativa de
                * escurecer a lista aberta, e não escurecia — a lista do <select>
                * é desenhada pelo navegador, não pelo CSS do elemento, então o
                * único efeito era deixar este campo com um fundo diferente dos
                * outros cinco. O dropdown claro foi resolvido no lugar certo,
                * com `color-scheme: dark` no `:root` (globals.css).
                *
                * O <select> segue nativo de propósito: teclado, ESC, setas,
                * Enter, ARIA, leitor de tela e o seletor em roda do iOS vêm de
                * graça e corretos. Um componente próprio teria de reimplementar
                * tudo isso para ganhar nada que se veja.
                */}
              <select id="contato-tipo" name="projectType" required defaultValue="" className={fieldClass}>
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
            className="btn-primary focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold disabled:cursor-wait disabled:opacity-60 sm:col-span-2"
          >
            {status === "loading" ? "Enviando..." : "Enviar solicitação"}
            <Send size={17} aria-hidden="true" />
          </button>

          {/*
            * A altura é reservada mesmo quando não há mensagem. Enquanto o <p>
            * ficava com altura zero no estado `idle`, a chegada da confirmação
            * empurrava o fim do formulário para baixo no momento exato em que o
            * visitante está olhando para ali — e, com o formulário no fim da
            * página, o salto move o que ele acabou de ler.
            *
            * `min-h` de uma linha custa 24px de espaço em branco permanente e
            * troca isso por zero deslocamento. O `mt-1` afasta a mensagem do
            * botão: só o `gap-5` da grade deixava as duas peças próximas o
            * bastante para a confirmação parecer parte do botão.
            */}
          <p aria-live="polite" className="mt-1 min-h-6 text-sm leading-6 sm:col-span-2">
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
