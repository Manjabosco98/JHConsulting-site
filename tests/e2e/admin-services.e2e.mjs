// E2E dos serviços (Fase 10): CRUD no painel + seção Serviços da home.
// Pré-requisitos iguais a admin-auth.e2e.mjs (servidor + usuários temporários).
//   E2E_PASSWORD=<senha> node --env-file=.env.local tests/e2e/admin-services.e2e.mjs
// Cria serviços temporários (slug e2e-srv-*) e os exclui no fim.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { get, loginThroughForm, postForm, reporter, waitForServer } from "./http.mjs";

const PW = process.env.E2E_PASSWORD;
if (!PW) throw new Error("Defina E2E_PASSWORD.");
const { check, finish } = reporter("E2E_SERVICES");
await waitForServer();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const pub = createClient(URL_, KEY);
const stamp = Date.now().toString(36);
const text = (html) => html.replace(/<!-- -->/g, "");
const body = async (path) => text(await (await get(path)).text());

const jar = await loginThroughForm("e2e-admin@test.invalid", PW);
const title = `E2E Serviço ${stamp}`;
const slug = `e2e-srv-${stamp}`;
const fields = (o = {}) => ({
  title, slug, description: "Descrição pública do serviço de teste.", icon: "Workflow",
  tech: "Python • Airflow • ETL", display_order: "99", active: "on", ...o
});

// Listagem mostra os 8 serviços do seed, com ícone resolvido
const listRes = await get("/admin/servicos", jar);
const list = text(await listRes.text());
check("listagem 200 com serviços do seed", listRes.status === 200 && list.includes("Automação de Processos") && list.includes("Consultoria Tecnológica"), `${listRes.status}`);
check("listagem informa ativos e ordem", /8 de 8 ativos/.test(list) && list.includes("ordem 1"));

// Criação: validação (ícone fora da allowlist e campos obrigatórios)
const newHtml = await (await get("/admin/servicos/novo", jar)).text();
check("formulário de novo serviço com seletor de ícones", newHtml.includes('data-form="service"') && newHtml.includes('aria-label="Workflow"') && newHtml.includes('role="radiogroup"'));
const invalid = await postForm("/admin/servicos/novo", newHtml, "service", fields({ title: "", description: "", icon: "EvilIcon" }), jar);
const invalidHtml = text(await invalid.text());
check("inválido: mensagens por campo, nada criado", invalid.status === 200 && invalidHtml.includes("Informe o título.") && invalidHtml.includes("Informe a descrição.") && invalidHtml.includes("Escolha um ícone da lista."), `${invalid.status}`);
const duplicate = await postForm("/admin/servicos/novo", newHtml, "service", fields({ slug: "automacao-de-processos" }), jar);
check("slug duplicado vira erro no campo", text(await duplicate.text()).includes("Já existe um serviço com este slug."));

// Criação ativa
const created = await postForm("/admin/servicos/novo", newHtml, "service", fields(), jar);
const id = /\/admin\/servicos\/([0-9a-f-]{36})\?criado=1$/.exec(created.headers.get("location") ?? "")?.[1];
check("criar: 303 para a edição", created.status === 303 && Boolean(id), `${created.status} ${created.headers.get("location")}`);

const editHtml = await (await get(`/admin/servicos/${id}?criado=1`, jar)).text();
check("edição mostra aviso e dados salvos", text(editHtml).includes("Serviço criado e ativo no site") && editHtml.includes(`value="${slug}"`) && editHtml.includes('value="Workflow"'));

// Home mostra o serviço ativo (revalidação on-demand)
const home = await body("/");
check("home mostra o serviço criado", home.includes(title) && home.includes("Descrição pública do serviço de teste."));
check("home mostra a linha de tecnologias", home.includes("Python • Airflow • ETL"));
const dbService = (await pub.from("services").select("icon, active, display_order").eq("slug", slug).maybeSingle()).data;
check("ícone salvo é o escolhido na allowlist", dbService?.icon === "Workflow", JSON.stringify(dbService));

// Desativar remove do site, mantém no painel
const deactivated = await postForm(`/admin/servicos/${id}`, editHtml, "service", fields({ active: [] }), jar);
check("salvar: 200 com confirmação", deactivated.status === 200 && text(await deactivated.text()).includes("Serviço salvo."));
check("inativo sai da home", !(await body("/")).includes(title));
check("inativo continua no painel como Inativo", text(await (await get("/admin/servicos", jar)).text()).includes("Inativo"));
check("inativo é invisível para o anônimo na API", ((await pub.from("services").select("id").eq("slug", slug)).data ?? []).length === 0);

// Reativar e editar título
const renamed = `${title} v2`;
await postForm(`/admin/servicos/${id}`, editHtml, "service", fields({ title: renamed, active: "on", icon: "Rocket" }), jar);
const homeAfter = await body("/");
check("reativar com novo título e ícone reflete na home", homeAfter.includes(renamed));

// Não-admin e anônimo não conseguem usar a action
const outside = new Map();
const user = createServerClient(URL_, KEY, {
  cookies: { getAll: () => [...outside].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => (value ? outside.set(name, value) : outside.delete(name))) }
});
await user.auth.signInWithPassword({ email: "e2e-user@test.invalid", password: PW });
const byUser = await postForm("/admin/servicos/novo", newHtml, "service", fields({ slug: `e2e-srv-intruso-${stamp}` }), outside);
const byAnon = await postForm("/admin/servicos/novo", newHtml, "service", fields({ slug: `e2e-srv-anon-${stamp}` }), undefined);
check("não-admin: action redireciona ao login", [303, 307].includes(byUser.status) && /\/admin\/login/.test(byUser.headers.get("location") ?? ""), `${byUser.status}`);
check("anônimo: proxy barra antes da action", byAnon.status === 307, `${byAnon.status}`);
await user.auth.signOut({ scope: "local" });

// Exclusão
const html = await (await get(`/admin/servicos/${id}`, jar)).text();
const deleted = await postForm(`/admin/servicos/${id}`, html, "delete-service", {}, jar);
check("excluir: 303 para a listagem", deleted.status === 303 && (deleted.headers.get("location") ?? "").endsWith("/admin/servicos?excluido=1"), `${deleted.status}`);
check("excluído retorna 404 no painel", (await get(`/admin/servicos/${id}`, jar)).status === 404);

const finalHome = await body("/");
check("home volta aos 8 serviços do seed", !finalHome.includes(renamed) && finalHome.includes("Automação de Processos") && finalHome.includes("Consultoria Tecnológica"));
const admin = createServerClient(URL_, KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll() {} } });
const residue = (await admin.from("services").select("slug").like("slug", `e2e-srv-%${stamp}`)).data;
check("sem resíduos (inclusive tentativas do intruso)", Array.isArray(residue) && residue.length === 0, JSON.stringify(residue));

finish();
