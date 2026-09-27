// E2E do CRUD de projetos (Fase 7) contra o Supabase Cloud real.
// Pré-requisitos iguais a admin-auth.e2e.mjs (servidor + usuários temporários).
//   E2E_PASSWORD=<senha> node --env-file=.env.local tests/e2e/admin-projects.e2e.mjs
// Cria e remove os próprios projetos (slugs e2e-*). Em falha no meio, limpar com:
//   delete from public.projects where slug like 'e2e-%';
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { get, jarFrom, loginThroughForm, postForm, reporter, waitForServer } from "./http.mjs";

const PW = process.env.E2E_PASSWORD;
if (!PW) throw new Error("Defina E2E_PASSWORD.");
const { check, finish } = reporter("E2E_PROJECTS");
await waitForServer();

const pub = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const stamp = Date.now().toString(36);
const slug = `e2e-projeto-${stamp}`;
const text = (html) => html.replace(/<!-- -->/g, "");
const publicProject = async (s) =>
  (await pub.from("projects").select("title, featured, project_technologies(display_order, technologies(slug))").eq("slug", s).maybeSingle()).data;
const techIds = Object.fromEntries(((await pub.from("technologies").select("id, slug").in("slug", ["python", "sql"])).data ?? []).map((t) => [t.slug, t.id]));

const fields = (overrides = {}) => ({
  title: `E2E Projeto ${stamp}`, slug: "", category: "Teste automatizado", status: "Case técnico",
  short_description: "Resumo do teste.", description: "Parágrafo 1.\n\nParágrafo 2.", problem: "Problema de teste.",
  solution: "Solução de teste.", repository_url: "", demo_url: "", display_order: "99",
  visibility: "draft", technology_ids: [techIds.python, techIds.sql], ...overrides
});

const jar = await loginThroughForm("e2e-admin@test.invalid", PW);

// Listagem
const list = await get("/admin/projetos", jar);
const listHtml = text(await list.text());
check("listagem 200 com projetos do seed", list.status === 200 && listHtml.includes("SGECHAT") && listHtml.includes("Automação Fiscal / NFS-e"));
check("filtros com contagem", /Publicados <span[^>]*>\d+<\/span>/.test(listHtml));
const filtered = text(await (await get("/admin/projetos?filtro=rascunhos", jar)).text());
check("filtro rascunhos não lista publicados", !filtered.includes("SGECHAT"));
const searched = text(await (await get("/admin/projetos?q=sgec", jar)).text());
check("busca por título", searched.includes("SGECHAT") && !searched.includes("Automação Fiscal"));

// Criação: validação
const newHtml = await (await get("/admin/projetos/novo", jar)).text();
check("formulário de novo projeto", newHtml.includes('data-form="project"') && newHtml.includes("Python"));
const invalid = await postForm("/admin/projetos/novo", newHtml, "project", fields({ title: "", category: "", demo_url: "javascript:alert(1)" }), jar);
const invalidHtml = text(await invalid.text());
check("inválido: mensagens por campo, sem redirecionar", invalid.status === 200 && invalidHtml.includes("Informe o título.") && invalidHtml.includes("Informe a categoria.") && invalidHtml.includes("começando com http://"), `${invalid.status}`);

const duplicate = await postForm("/admin/projetos/novo", newHtml, "project", fields({ slug: "sgechat" }), jar);
check("slug duplicado vira erro no campo", text(await duplicate.text()).includes("Já existe um projeto com este slug."));

// Criação: rascunho
const created = await postForm("/admin/projetos/novo", newHtml, "project", fields({ slug }), jar);
const location = created.headers.get("location") ?? "";
const id = /\/admin\/projetos\/([0-9a-f-]{36})\?criado=1$/.exec(location)?.[1];
check("criar: 303 para a edição", created.status === 303 && Boolean(id), `${created.status} ${location}`);
check("rascunho invisível ao público", (await publicProject(slug)) === null);

const editHtml = await (await get(`/admin/projetos/${id}?criado=1`, jar)).text();
check("edição mostra aviso de criação e dados salvos", text(editHtml).includes("Projeto criado como rascunho") && editHtml.includes(`value="${slug}"`));
const hiddenTechs = [...editHtml.matchAll(/name="technology_ids" value="([^"]+)"/g)].map((m) => m[1]);
check("tecnologias salvas na ordem escolhida", hiddenTechs.join() === [techIds.python, techIds.sql].join(), hiddenTechs.join());

// Edição: publicar, reordenar, destacar
const saved = await postForm(`/admin/projetos/${id}`, editHtml, "project",
  fields({ slug, visibility: "published", featured: "on", technology_ids: [techIds.sql, techIds.python] }), jar);
check("salvar: 200 com confirmação", saved.status === 200 && text(await saved.text()).includes("Projeto salvo."), `${saved.status}`);
const published = await publicProject(slug);
const order = published?.project_technologies.sort((a, b) => a.display_order - b.display_order).map((l) => l.technologies.slug).join();
check("publicado aparece para o público, com destaque", published?.featured === true);
check("nova ordem das tecnologias", order === "sql,python", order);

const badUrl = await postForm(`/admin/projetos/${id}`, editHtml, "project", fields({ slug, visibility: "published", repository_url: "ftp://x" }), jar);
check("edição inválida não altera o banco", text(await badUrl.text()).includes("começando com http://") && (await publicProject(slug))?.featured === true);

// Arquivar
await postForm(`/admin/projetos/${id}`, editHtml, "project", fields({ slug, visibility: "archived" }), jar);
check("arquivado some do público", (await publicProject(slug)) === null);
const archivedList = text(await (await get("/admin/projetos?filtro=arquivados", jar)).text());
check("arquivado aparece no filtro Arquivados", archivedList.includes(`E2E Projeto ${stamp}`));

// Não-admin e anônimo não conseguem usar a action
const outside = new Map();
const direct = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  cookies: { getAll: () => [...outside].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => (value ? outside.set(name, value) : outside.delete(name))) }
});
await direct.auth.signInWithPassword({ email: "e2e-user@test.invalid", password: PW });
const intruderSlug = `e2e-intruso-${stamp}`;
const byUser = await postForm("/admin/projetos/novo", newHtml, "project", fields({ slug: intruderSlug, visibility: "published" }), outside);
const byAnon = await postForm("/admin/projetos/novo", newHtml, "project", fields({ slug: intruderSlug, visibility: "published" }));
check("não-admin: action redireciona ao login", [303, 307].includes(byUser.status) && /\/admin\/login/.test(byUser.headers.get("location") ?? ""), `${byUser.status}`);
check("anônimo: proxy barra antes da action", byAnon.status === 307, `${byAnon.status}`);
await direct.auth.signOut({ scope: "local" });

// Exclusão
const deleted = await postForm(`/admin/projetos/${id}`, editHtml, "delete-project", {}, jar);
check("excluir: 303 para a listagem", deleted.status === 303 && (deleted.headers.get("location") ?? "").endsWith("/admin/projetos?excluido=1"), `${deleted.status}`);
check("projeto excluído retorna 404 no painel", (await get(`/admin/projetos/${id}`, jar)).status === 404);
jarFrom(deleted, jar);

// Verificação final via sessão admin (inclui rascunhos): nenhum resíduo e2e/intruso
const adminClient = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll() {} }
});
const leftovers = (await adminClient.from("projects").select("slug").like("slug", `e2e-%${stamp}`)).data;
check("sem resíduos (inclusive tentativa do intruso)", Array.isArray(leftovers) && leftovers.length === 0, JSON.stringify(leftovers));

finish();
