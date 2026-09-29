// Teste de navegador do formulário público (Fase 17).
//
// Cobre o handler de envio em src/components/sections/Contact.tsx — onde estava
// o defeito que foi para produção: o formulário mostrava erro mesmo quando o
// envio dava certo, porque `e.currentTarget` fica nulo depois do primeiro await.
//
// O `fetch` da página é substituído, então nenhuma requisição sai e nenhum
// e-mail é enviado: o que está sob teste é a reação da interface a cada
// resposta possível do endpoint.
//
// Pré-requisitos:
//   1. servidor de produção rodando (o mesmo dos E2E):
//      npm run build && npx next start --hostname 127.0.0.1 --port 3431
//   2. navegador headless com depuração remota:
//      msedge --headless=new --remote-debugging-port=9222 --user-data-dir=<tmp> about:blank
//   3. node tests/browser/contact-form.browser.mjs
import { BASE, reporter, waitForServer } from "../e2e/http.mjs";
import { connect } from "./cdp.mjs";

const { check, finish } = reporter("BROWSER_CONTACT");
await waitForServer();
const page = await connect();

const SUCCESS = "Solicitação enviada com sucesso.";
const GENERIC = "Não foi possível enviar agora. Tente novamente ou use o WhatsApp.";
const RATE = "Muitas solicitações em pouco tempo. Aguarde um minuto e tente novamente.";

/** Replaces fetch with a canned answer and submits the form once. */
const submit = (answer) => `(() => {
  const form = document.querySelector("#contato form");
  window.__calls = [];
  window.fetch = async (url, init) => {
    window.__calls.push({ url: String(url), body: init && init.body });
    ${answer}
  };
  const set = (name, value) => { const field = form.elements[name]; if (field) field.value = value; };
  set("name", "Maria Souza");
  set("company", "ACME");
  set("email", "maria@acme.com.br");
  set("whatsapp", "62996101996");
  set("projectType", "Automação");
  set("message", "Mensagem de teste com mais de vinte caracteres para passar na validação.");
  form.requestSubmit();
  return true;
})()`;

// Seleciona a região de status pelo `aria-live`, e não por "qualquer <p> do
// formulário": desde que os campos ganharam rótulo visível e texto de apoio, há
// parágrafos permanentes dentro do form, e o seletor antigo devolvia texto já na
// primeira leitura — o `waitFor` terminava antes da resposta do envio chegar.
const texts = `Array.from(document.querySelectorAll("#contato form [aria-live]")).map((el) => el.textContent).join(" | ")`;
const messageValue = `document.querySelector("#contato form [name=message]").value`;
const buttonLabel = `document.querySelector("#contato form button").textContent`;

/**
 * React only attaches onSubmit after hydration. Submitting before that makes the
 * browser do a native submit and reload the page, which looks like a failure
 * that has nothing to do with the code under test.
 */
const hydrated = `(() => {
  const form = document.querySelector("#contato form");
  return Boolean(form) && Object.keys(form).some((key) => key.startsWith("__reactFiber$"));
})()`;

async function scenario(label, answer) {
  await page.goto(`${BASE}/`);
  if (!(await page.waitFor(hydrated))) throw new Error(`A página não hidratou a tempo (cenário ${label}).`);
  await page.evaluate(submit(answer));
  const shown = await page.waitFor(`(() => { const t = ${texts}; return t.trim() ? t : null; })()`);
  return { label, shown: shown ?? "", calls: await page.evaluate("window.__calls") };
}

// 1. Sucesso: a regressão. Antes, o catch pegava o acesso a currentTarget nulo
//    e a interface mostrava erro mesmo com o envio aceito.
const ok = await scenario("200", `return new Response(JSON.stringify({ ok: true, stored: true, notified: true }), { status: 200 });`);
check("envio aceito mostra sucesso", ok.shown.includes(SUCCESS), ok.shown);
check("envio aceito não mostra erro junto", !ok.shown.includes(GENERIC) && !ok.shown.includes(RATE), ok.shown);
check("o formulário é enviado como JSON para /api/contact", ok.calls.length === 1 && ok.calls[0].url.includes("/api/contact") && ok.calls[0].body.includes("Maria Souza"), JSON.stringify(ok.calls).slice(0, 200));
check("campos são limpos depois do sucesso", (await page.evaluate(messageValue)) === "", "mensagem deveria estar vazia");

// 2. Rate limit: mensagem específica, para o visitante saber que é só aguardar.
const limited = await scenario("429", `return new Response(JSON.stringify({ ok: false, error: "rate_limit" }), { status: 429 });`);
check("429 mostra a mensagem de excesso de tentativas", limited.shown.includes(RATE), limited.shown);
check("429 não mostra sucesso", !limited.shown.includes(SUCCESS), limited.shown);
check("429 preserva o que foi digitado", (await page.evaluate(messageValue)).length > 20, "o texto não pode ser perdido");

// 3. Indisponível: mensagem genérica apontando o WhatsApp como alternativa.
const unavailable = await scenario("503", `return new Response(JSON.stringify({ ok: false, error: "unavailable" }), { status: 503 });`);
check("503 mostra a mensagem genérica com alternativa", unavailable.shown.includes(GENERIC), unavailable.shown);
check("503 preserva o que foi digitado", (await page.evaluate(messageValue)).length > 20, "o texto não pode ser perdido");

// 4. Rede caindo no meio: não pode virar exceção não tratada.
const offline = await scenario("rede", `throw new TypeError("Failed to fetch");`);
check("falha de rede vira mensagem tratada", offline.shown.includes(GENERIC), offline.shown);

// 5. Estado de envio: o botão desabilita enquanto espera.
await page.goto(`${BASE}/`);
if (!(await page.waitFor(hydrated))) throw new Error("A página não hidratou a tempo (estado de envio).");
await page.evaluate(submit(`await new Promise((r) => setTimeout(r, 1500)); return new Response(JSON.stringify({ ok: true }), { status: 200 });`));
const pending = await page.waitFor(`(() => { const b = document.querySelector("#contato form button"); return b.disabled ? b.textContent : null; })()`, 3000);
check("enquanto envia, o botão fica desabilitado e indica o estado", Boolean(pending) && /Enviando/.test(pending), String(pending));
const settled = await page.waitFor(`(() => { const t = ${texts}; return t.includes(${JSON.stringify(SUCCESS)}) ? t : null; })()`);
check("ao terminar, volta ao rótulo normal e confirma o envio", Boolean(settled) && /Enviar solicitação/.test(await page.evaluate(buttonLabel)), String(settled));

page.close();
finish();
