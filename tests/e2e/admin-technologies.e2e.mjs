// E2E das tecnologias (Fase 11): catálogo, grupos N:N e seção pública.
// Pré-requisitos iguais a admin-auth.e2e.mjs (servidor + usuários temporários).
//   E2E_PASSWORD=<senha> node --env-file=.env.local tests/e2e/admin-technologies.e2e.mjs
// Cria tecnologias/grupos temporários (slug e2e-*) e os exclui no fim.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { get, loginThroughForm, postForm, reporter, waitForServer } from "./http.mjs";

const PW = process.env.E2E_PASSWORD;
if (!PW) throw new Error("Defina E2E_PASSWORD.");
const { check, finish } = reporter("E2E_TECHNOLOGIES");
await waitForServer();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const pub = createClient(URL_, KEY);
const stamp = Date.now().toString(36);
const text = (html) => html.replace(/<!-- -->/g, "");
const body = async (path) => text(await (await get(path)).text());

const jar = await loginThroughForm("e2e-admin@test.invalid", PW);
const admin = createServerClient(URL_, KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll() {} } });
const pythonId = (await pub.from("technologies").select("id").eq("slug", "python").single()).data.id;

const techName = `E2E Tech ${stamp}`;
const techSlug = `e2e-tech-${stamp}`;
const groupName = `E2E Grupo ${stamp}`;
const groupSlug = `e2e-grupo-${stamp}`;

// Página principal: catálogo + grupos do seed
const listRes = await get("/admin/tecnologias", jar);
const list = text(await listRes.text());
check("página 200 com grupos e catálogo do seed", listRes.status === 200 && list.includes("Backend") && list.includes("Bancos de Dados") && list.includes("Python"), `${listRes.status}`);
check("catálogo informa 32 tecnologias ativas", /32 de 32 ativas/.test(list), list.match(/\d+ de \d+ ativas/)?.[0]);
check("Python aparece em 2 grupos (N:N preservado)", /Python[\s\S]{0,200}?2 grupo\(s\)/.test(list));

// Criar tecnologia
const newTechHtml = await (await get("/admin/tecnologias/nova", jar)).text();
check("formulário de nova tecnologia", newTechHtml.includes('data-form="technology"'));
const invalidTech = await postForm("/admin/tecnologias/nova", newTechHtml, "technology", { name: "", slug: "", display_order: "-1", active: "on" }, jar);
const invalidHtml = text(await invalidTech.text());
check("tecnologia inválida: mensagens por campo", invalidTech.status === 200 && invalidHtml.includes("Informe o nome.") && invalidHtml.includes("Use 0 ou maior."));
const dupTech = await postForm("/admin/tecnologias/nova", newTechHtml, "technology", { name: "Python", slug: "python", display_order: "0", active: "on" }, jar);
check("slug duplicado vira erro no campo", text(await dupTech.text()).includes("Já existe uma tecnologia com este slug."));

const createdTech = await postForm("/admin/tecnologias/nova", newTechHtml, "technology", { name: techName, slug: techSlug, display_order: "50", active: "on" }, jar);
const techId = /\/admin\/tecnologias\/([0-9a-f-]{36})\?criado=1$/.exec(createdTech.headers.get("location") ?? "")?.[1];
check("criar tecnologia: 303 para a edição", createdTech.status === 303 && Boolean(techId), `${createdTech.status} ${createdTech.headers.get("location")}`);
check("tecnologia fora de grupo não aparece na home", !(await body("/")).includes(techName));

// Criar grupo com a nova tecnologia + Python (ordem definida)
const newGroupHtml = await (await get("/admin/tecnologias/grupos/novo", jar)).text();
check("formulário de novo grupo lista tecnologias", newGroupHtml.includes('data-form="technology-group"') && newGroupHtml.includes(techName));
const createdGroup = await postForm("/admin/tecnologias/grupos/novo", newGroupHtml, "technology-group", {
  name: groupName, slug: groupSlug, display_order: "0", active: "on", technology_ids: [techId, pythonId]
}, jar);
const groupId = /\/admin\/tecnologias\/grupos\/([0-9a-f-]{36})\?criado=1$/.exec(createdGroup.headers.get("location") ?? "")?.[1];
check("criar grupo: 303 para a edição", createdGroup.status === 303 && Boolean(groupId), `${createdGroup.status}`);

const homeWithGroup = await body("/");
const groupBlock = homeWithGroup.slice(homeWithGroup.indexOf(groupName), homeWithGroup.indexOf(groupName) + 500);
check("grupo aparece na home com as tecnologias", homeWithGroup.includes(groupName) && groupBlock.includes(techName) && groupBlock.includes("Python"));
check("ordem dentro do grupo respeitada", groupBlock.indexOf(techName) < groupBlock.indexOf("Python"), groupBlock.replace(/<[^>]+>/g, " ").slice(0, 120));
check("Python continua nos grupos originais (N:N)", homeWithGroup.includes("Backend") && /Backend[\s\S]{0,400}?Python/.test(homeWithGroup));

// Reordenar membros do grupo
const groupHtml = await (await get(`/admin/tecnologias/grupos/${groupId}`, jar)).text();
check("edição do grupo mostra membros na ordem salva", groupHtml.indexOf(`value="${techId}"`) < groupHtml.indexOf(`value="${pythonId}"`));
await postForm(`/admin/tecnologias/grupos/${groupId}`, groupHtml, "technology-group", {
  name: groupName, slug: groupSlug, display_order: "0", active: "on", technology_ids: [pythonId, techId]
}, jar);
const reordered = await body("/");
const reorderedBlock = reordered.slice(reordered.indexOf(groupName), reordered.indexOf(groupName) + 500);
check("nova ordem reflete na home", reorderedBlock.indexOf("Python") < reorderedBlock.indexOf(techName));

// Desativar tecnologia some do grupo no site; desativar grupo some a seção
await postForm(`/admin/tecnologias/${techId}`, await (await get(`/admin/tecnologias/${techId}`, jar)).text(), "technology",
  { name: techName, slug: techSlug, display_order: "50", active: [] }, jar);
const withoutTech = await body("/");
check("tecnologia inativa sai do grupo na home", withoutTech.includes(groupName) && !withoutTech.includes(techName));
await postForm(`/admin/tecnologias/grupos/${groupId}`, await (await get(`/admin/tecnologias/grupos/${groupId}`, jar)).text(), "technology-group",
  { name: groupName, slug: groupSlug, display_order: "0", active: [], technology_ids: [pythonId, techId] }, jar);
check("grupo inativo sai da home", !(await body("/")).includes(groupName));
check("grupo inativo é invisível para o anônimo", ((await pub.from("technology_groups").select("id").eq("slug", groupSlug)).data ?? []).length === 0);

// Exclusão bloqueada: tecnologia vinculada a projeto
const pythonHtml = await (await get(`/admin/tecnologias/${pythonId}`, jar)).text();
const blocked = await postForm(`/admin/tecnologias/${pythonId}`, pythonHtml, "delete-technology", {}, jar);
check("excluir tecnologia usada por projeto: redireciona com motivo", blocked.status === 303 && (blocked.headers.get("location") ?? "").endsWith(`?erro=in_use`), `${blocked.status} ${blocked.headers.get("location")}`);
const blockedPage = text(await (await get(`/admin/tecnologias/${pythonId}?erro=in_use`, jar)).text());
check("mensagem explica o vínculo com projetos", blockedPage.includes("vinculada a um ou mais projetos"));
check("Python continua no banco", ((await pub.from("technologies").select("id").eq("slug", "python")).data ?? []).length === 1);

// Não-admin e anônimo
const outside = new Map();
const user = createServerClient(URL_, KEY, {
  cookies: { getAll: () => [...outside].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => (value ? outside.set(name, value) : outside.delete(name))) }
});
await user.auth.signInWithPassword({ email: "e2e-user@test.invalid", password: PW });
const byUser = await postForm("/admin/tecnologias/nova", newTechHtml, "technology", { name: `Intruso ${stamp}`, slug: `e2e-intruso-${stamp}`, display_order: "0", active: "on" }, outside);
const byAnon = await postForm("/admin/tecnologias/nova", newTechHtml, "technology", { name: `Anon ${stamp}`, slug: `e2e-anon-${stamp}`, display_order: "0", active: "on" });
check("não-admin: action redireciona ao login", [303, 307].includes(byUser.status) && /\/admin\/login/.test(byUser.headers.get("location") ?? ""), `${byUser.status}`);
check("anônimo: proxy barra antes da action", byAnon.status === 307, `${byAnon.status}`);
await user.auth.signOut({ scope: "local" });

// Excluir grupo (tecnologias permanecem) e depois a tecnologia livre
const delGroup = await postForm(`/admin/tecnologias/grupos/${groupId}`, await (await get(`/admin/tecnologias/grupos/${groupId}`, jar)).text(), "delete-group", {}, jar);
check("excluir grupo: 303 e tecnologias preservadas", delGroup.status === 303 && (delGroup.headers.get("location") ?? "").endsWith("?grupo_excluido=1") && ((await admin.from("technologies").select("id").eq("slug", techSlug)).data ?? []).length === 1, `${delGroup.status}`);
const delTech = await postForm(`/admin/tecnologias/${techId}`, await (await get(`/admin/tecnologias/${techId}`, jar)).text(), "delete-technology", {}, jar);
check("excluir tecnologia livre: 303 para a listagem", delTech.status === 303 && (delTech.headers.get("location") ?? "").endsWith("?excluido=1"), `${delTech.status}`);
check("excluída retorna 404 no painel", (await get(`/admin/tecnologias/${techId}`, jar)).status === 404);

// Estado final: seção pública volta ao seed
const finalHome = await body("/");
check("home volta aos 7 grupos do seed", ["Backend", "Automação", "Dados", "Engenharia de Dados", "Bancos de Dados", "Inteligência Artificial", "Infraestrutura"].every((name) => finalHome.includes(name)));
const residue = (await admin.from("technologies").select("slug").like("slug", `e2e-%${stamp}`)).data;
const groupResidue = (await admin.from("technology_groups").select("slug").like("slug", `e2e-%${stamp}`)).data;
check("sem resíduos", (residue ?? []).length === 0 && (groupResidue ?? []).length === 0, JSON.stringify({ residue, groupResidue }));

finish();
