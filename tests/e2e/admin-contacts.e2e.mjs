// E2E dos contatos (Fase 13): endpoint público + painel /admin/contatos.
// Pré-requisitos iguais a admin-auth.e2e.mjs (servidor + usuários temporários).
//   E2E_PASSWORD=<senha> node --env-file=.env.local tests/e2e/admin-contacts.e2e.mjs
//
// Com SUPABASE_SECRET_KEY configurada, a suíte cria o próprio lead pelo
// formulário público. Sem ela, usa um contato semeado com e-mail
// 'e2e-contato-%@test.invalid' (o insert exige a chave privilegiada).
//
// ATENÇÃO: contato é registro histórico — nem admin nem service_role apagam.
// A limpeza é feita pelo conector Supabase depois da suíte:
//   delete from public.contacts where email like 'e2e-contato-%@test.invalid';
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { BASE, get, loginThroughForm, postForm, reporter, waitForServer } from "./http.mjs";

const PW = process.env.E2E_PASSWORD;
if (!PW) throw new Error("Defina E2E_PASSWORD.");
const { check, finish } = reporter("E2E_CONTACTS");
await waitForServer();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const pub = createClient(URL_, KEY);
const stamp = Date.now().toString(36);
const text = (html) => html.replace(/<!-- -->/g, "");
const body = async (path) => text(await (await get(path)).text());

const jar = await loginThroughForm("e2e-admin@test.invalid", PW);
const sessionClient = (cookies) =>
  createServerClient(URL_, KEY, {
    cookies: { getAll: () => [...cookies].map(([name, value]) => ({ name, value })), setAll() {} }
  });
const admin = sessionClient(jar);

// Cada cliente lógico usa um IP próprio: o rate limit é por endereço.
const send = (raw, ip) =>
  fetch(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: raw
  });
const sendJson = (payload, ip) => send(JSON.stringify(payload), ip);

const email = `e2e-contato-${stamp}@test.invalid`;
const lead = {
  name: `E2E Contato ${stamp}`,
  company: "ACME Testes",
  email,
  whatsapp: "(11) 98888-7777",
  projectType: "Automação",
  message: `Mensagem do teste ${stamp}.\r\nSegunda linha para conferir a normalização de CRLF.`
};

// ---------- Endpoint público ----------
const before = (await admin.from("contacts").select("id", { count: "exact", head: true })).count ?? 0;

const malformed = await send("{isso-nao-e-json", "198.51.100.1");
check("JSON malformado responde 400 (antes era 500)", malformed.status === 400, `${malformed.status}`);

const shortMessage = await sendJson({ ...lead, message: "curta" }, "198.51.100.2");
check("mensagem curta responde 400", shortMessage.status === 400, `${shortMessage.status}`);
const badEmail = await sendJson({ ...lead, email: "sem-arroba" }, "198.51.100.3");
check("e-mail inválido responde 400", badEmail.status === 400, `${badEmail.status}`);

const honeypot = await sendJson({ ...lead, email: `e2e-contato-bot-${stamp}@test.invalid`, website: "http://spam.example" }, "198.51.100.4");
const honeypotBody = await honeypot.json();
check("honeypot responde 200 sem gravar", honeypot.status === 200 && honeypotBody.stored === false, `${honeypot.status} ${JSON.stringify(honeypotBody)}`);

const created = await sendJson(lead, "198.51.100.5");
const createdBody = await created.json();
const stored = created.status === 200 && createdBody.stored === true;
if (stored) {
  check("lead válido é gravado (200 stored=true)", true);
} else {
  check(
    "sem SUPABASE_SECRET_KEY e sem Resend o endpoint responde 503 unavailable",
    created.status === 503 && createdBody.error === "unavailable",
    `${created.status} ${JSON.stringify(createdBody)}`
  );
}

// Rate limit: 5 por minuto por endereço, o sexto é barrado
const rateIp = "198.51.100.90";
let rateStatus = 0;
for (let i = 0; i < 6; i += 1) rateStatus = (await sendJson({ ...lead, email: `e2e-contato-rate-${i}-${stamp}@test.invalid` }, rateIp)).status;
check("sexta tentativa do mesmo endereço responde 429", rateStatus === 429, `${rateStatus}`);

const after = (await admin.from("contacts").select("id", { count: "exact", head: true })).count ?? 0;
const expectedNew = stored ? 6 : 0; // o lead + 5 aceitos no teste de rate limit
check("nenhuma gravação inesperada (honeypot e inválidos não contam)", after - before === expectedNew, `antes=${before} depois=${after}`);

// ---------- Painel ----------
const target = (
  await admin
    .from("contacts")
    .select("id, name, email, message, status, whatsapp, project_type, source")
    .like("email", "e2e-contato-%@test.invalid")
    .not("email", "like", "e2e-contato-rate-%")
    .order("created_at", { ascending: false })
    .limit(1)
).data?.[0];
if (!target) throw new Error("Nenhum contato de teste disponível. Semeie um e-mail e2e-contato-%@test.invalid ou configure SUPABASE_SECRET_KEY.");

if (stored) {
  check("CRLF do formulário é normalizado no banco", !target.message.includes("\r") && target.message.includes("\n"), JSON.stringify(target.message));
  check("origem gravada como SITE e status inicial NEW", target.source === "SITE" && target.status === "NEW", `${target.source}/${target.status}`);
}

const listRes = await get("/admin/contatos", jar);
const list = text(await listRes.text());
check("listagem 200 com o contato", listRes.status === 200 && list.includes(target.name) && list.includes(target.email), `${listRes.status}`);
check("abas de status presentes na listagem", ["Todos", "Novo", "Contatado", "Em negociação", "Convertido", "Arquivado"].every((label) => list.includes(label)));

const converted = text(await (await get("/admin/contatos?status=CONVERTED", jar)).text());
check("filtro por status não lista quem não tem aquele status", !converted.includes(target.email));

const detailRes = await get(`/admin/contatos/${target.id}`, jar);
const detail = text(await detailRes.text());
check("detalhe 200 com mensagem completa e ações de contato", detailRes.status === 200 && detail.includes(`mailto:${target.email}`) && detail.includes("Andamento do atendimento"), `${detailRes.status}`);
const leadDigits = (target.whatsapp ?? "").replace(/\D/g, "");
check(
  "WhatsApp do lead vira link wa.me (e não aparece sem número)",
  leadDigits ? detail.includes(`https://wa.me/${leadDigits}`) : !detail.includes("wa.me/"),
  leadDigits
);
check("uuid inexistente no detalhe é 404", (await get("/admin/contatos/00000000-0000-4000-8000-000000000000", jar)).status === 404);
check("id fora do formato uuid é 404", (await get("/admin/contatos/nao-e-uuid", jar)).status === 404);

// Mudança de status
const changed = await postForm(`/admin/contatos/${target.id}`, detail, "contact-status", { status: "CONTACTED" }, jar);
check("alterar status: 303 com confirmação", changed.status === 303 && (changed.headers.get("location") ?? "").endsWith(`/admin/contatos/${target.id}?atualizado=1`), `${changed.status} ${changed.headers.get("location")}`);
const afterChange = (await admin.from("contacts").select("status, message, name").eq("id", target.id).maybeSingle()).data;
check("status gravado é o escolhido", afterChange?.status === "CONTACTED", JSON.stringify(afterChange));
check("mensagem e nome do lead ficam intactos", afterChange?.message === target.message && afterChange?.name === target.name);
check("lista filtrada pelo novo status inclui o contato", text(await (await get("/admin/contatos?status=CONTACTED", jar)).text()).includes(target.email));

// Status inválido enviado direto na action
const tampered = await postForm(`/admin/contatos/${target.id}`, detail, "contact-status", { status: "EXCLUIDO" }, jar);
check("status fora do enum volta com erro e não altera", tampered.status === 303 && /erro=status/.test(tampered.headers.get("location") ?? ""), `${tampered.status} ${tampered.headers.get("location")}`);
check("status permanece CONTACTED após tentativa inválida", (await admin.from("contacts").select("status").eq("id", target.id).maybeSingle()).data?.status === "CONTACTED");

// ---------- Autorização ----------
const outside = new Map();
const user = createServerClient(URL_, KEY, {
  cookies: { getAll: () => [...outside].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => (value ? outside.set(name, value) : outside.delete(name))) }
});
await user.auth.signInWithPassword({ email: "e2e-user@test.invalid", password: PW });

const byUserPage = await get("/admin/contatos", outside);
check("não-admin não abre a listagem", [303, 307].includes(byUserPage.status) && /\/admin\/login/.test(byUserPage.headers.get("location") ?? ""), `${byUserPage.status}`);
const byUserAction = await postForm(`/admin/contatos/${target.id}`, detail, "contact-status", { status: "CONVERTED" }, outside);
check("não-admin: action redireciona ao login", [303, 307].includes(byUserAction.status) && /\/admin\/login/.test(byUserAction.headers.get("location") ?? ""), `${byUserAction.status}`);
const byAnonAction = await postForm(`/admin/contatos/${target.id}`, detail, "contact-status", { status: "CONVERTED" }, undefined);
check("anônimo: proxy barra antes da action", byAnonAction.status === 307, `${byAnonAction.status}`);
check("status segue CONTACTED após as tentativas", (await admin.from("contacts").select("status").eq("id", target.id).maybeSingle()).data?.status === "CONTACTED");

const userRead = await user.from("contacts").select("id");
check("usuário comum não lê contatos pela API", (userRead.data ?? []).length === 0, JSON.stringify(userRead.error?.code ?? userRead.data));
const anonRead = await pub.from("contacts").select("id");
check("anônimo recebe erro de permissão em contacts", anonRead.error?.code === "42501", JSON.stringify(anonRead.error ?? anonRead.data));
await user.auth.signOut({ scope: "local" });

// ---------- Nada de contato vaza para o site público ----------
const home = await body("/");
check("home não expõe dados do lead", !home.includes(target.email) && !home.includes(target.name));
check("sitemap não cita contatos", !(await body("/sitemap.xml")).includes("contatos"));

finish();
