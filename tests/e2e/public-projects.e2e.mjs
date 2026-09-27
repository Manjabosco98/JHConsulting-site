// E2E dos projetos públicos (Fase 9) contra o Supabase Cloud real.
// Pré-requisitos iguais a admin-auth.e2e.mjs (servidor + usuários temporários).
//   E2E_PASSWORD=<senha> node --env-file=.env.local tests/e2e/public-projects.e2e.mjs
// Cria projetos temporários (slug e2e-pub-*) pelo painel e os exclui no fim,
// verificando a revalidação on-demand das páginas públicas (ISR).
import { createClient } from "@supabase/supabase-js";
import { get, loginThroughForm, postForm, reporter, waitForServer } from "./http.mjs";

const PW = process.env.E2E_PASSWORD;
if (!PW) throw new Error("Defina E2E_PASSWORD.");
const { check, finish } = reporter("E2E_PUBLIC");
await waitForServer();

const pub = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const techIds = Object.fromEntries(((await pub.from("technologies").select("id, name").in("name", ["Python", "SQL"])).data ?? []).map((t) => [t.name, t.id]));
const stamp = Date.now().toString(36);
const jar = await loginThroughForm("e2e-admin@test.invalid", PW);
const text = (html) => html.replace(/<!-- -->/g, "");
const body = async (path) => text(await (await get(path)).text());

const fields = (o) => ({
  title: "", slug: "", category: "Automação empresarial", status: "Case técnico", short_description: "Resumo público do case.",
  description: "Primeiro parágrafo da descrição.\n\nSegundo parágrafo com mais detalhes.", problem: "Rotina manual e repetitiva.",
  solution: "Automação ponta a ponta.", repository_url: "https://github.com/jh/exemplo", demo_url: "", display_order: "0",
  visibility: "draft", technology_ids: [techIds.Python, techIds.SQL], ...o
});
async function createProject(extra) {
  const html = await (await get("/admin/projetos/novo", jar)).text();
  const res = await postForm("/admin/projetos/novo", html, "project", fields(extra), jar);
  return /\/admin\/projetos\/([0-9a-f-]{36})/.exec(res.headers.get("location") ?? "")?.[1];
}
async function setVisibility(id, visibility) {
  const html = await (await get(`/admin/projetos/${id}`, jar)).text();
  await postForm(`/admin/projetos/${id}`, html, "project", fields({ visibility, title: pubTitle, slug: pubSlug }), jar);
}
async function remove(id) {
  const html = await (await get(`/admin/projetos/${id}`, jar)).text();
  await postForm(`/admin/projetos/${id}`, html, "delete-project", {}, jar);
}

const pubTitle = `E2E Publicado ${stamp}`;
const pubSlug = `e2e-pub-${stamp}`;
const draftTitle = `E2E Rascunho ${stamp}`;
const draftSlug = `e2e-draft-${stamp}`;

const publishedId = await createProject({ title: pubTitle, slug: pubSlug, visibility: "published" });
const draftId = await createProject({ title: draftTitle, slug: draftSlug, visibility: "draft" });
check("projetos temporários criados", Boolean(publishedId && draftId));

// Listagem pública mostra publicado, esconde rascunho
const list = await body("/projetos");
check("/projetos lista o publicado com link de detalhe", list.includes(pubTitle) && list.includes(`href="/projetos/${pubSlug}"`));
check("/projetos esconde o rascunho", !list.includes(draftTitle));

// Home mostra o publicado e o link "ver todos"
const home = await body("/");
check("home mostra projeto publicado e link para /projetos", home.includes(pubTitle) && home.includes('href="/projetos"'));
check("home esconde rascunho", !home.includes(draftTitle));

// Detalhe do publicado
const detailRes = await get(`/projetos/${pubSlug}`);
const detail = text(await detailRes.text());
check("detalhe 200 com conteúdo", detailRes.status === 200 && detail.includes(`<h1`) && detail.includes(pubTitle) && detail.includes("Rotina manual e repetitiva.") && detail.includes("Automação ponta a ponta."));
check("detalhe mostra os dois parágrafos da descrição", detail.includes("Primeiro parágrafo da descrição.") && detail.includes("Segundo parágrafo com mais detalhes."));
check("detalhe lista tecnologias e link do repositório", detail.includes(">Python<") && detail.includes(">SQL<") && detail.includes("https://github.com/jh/exemplo"));
// metadataBase torna canonical/og:url absolutos; conferimos por sufixo.
check("detalhe: canonical e og:url apontam para o projeto", detail.includes('rel="canonical"') && detail.includes(`/projetos/${pubSlug}"`) && detail.includes('property="og:url"'));
check("detalhe: título na aba inclui o nome do projeto", /<title>[^<]*E2E Publicado[^<]*<\/title>/.test(detail));
check("página interna: âncoras da navbar apontam para a home", detail.includes('href="/#contato"') && detail.includes('href="/#servicos"'));

// Rascunho e inexistente -> 404
check("detalhe de rascunho retorna 404", (await get(`/projetos/${draftSlug}`)).status === 404);
check("slug inexistente retorna 404", (await get(`/projetos/nao-existe-${stamp}`)).status === 404);

// Sitemap on-demand
const sitemap = await (await get("/sitemap.xml")).text();
check("sitemap inclui o publicado, não o rascunho", sitemap.includes(`/projetos/${pubSlug}`) && !sitemap.includes(`/projetos/${draftSlug}`));

// Despublicar remove das páginas públicas (revalidação on-demand)
await setVisibility(publishedId, "draft");
const afterUnpublish = await body("/projetos");
check("despublicar remove da listagem", !afterUnpublish.includes(pubTitle));
check("despublicar: detalhe vira 404", (await get(`/projetos/${pubSlug}`)).status === 404);
check("despublicar: some da home", !(await body("/")).includes(pubTitle));

// Limpeza
await remove(publishedId);
await remove(draftId);
const residue = (await pub.from("projects").select("slug").like("slug", `e2e-%${stamp}`)).data;
check("sem resíduos no banco", Array.isArray(residue) && residue.length === 0, JSON.stringify(residue));
const finalHome = await body("/");
check("home volta a mostrar apenas os projetos reais (SGECHAT)", finalHome.includes("SGECHAT") && !finalHome.includes(pubTitle));

finish();
