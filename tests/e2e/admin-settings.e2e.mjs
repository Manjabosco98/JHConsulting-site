// E2E das configurações (Fase 12): formulário, foto e reflexo no site público.
// Pré-requisitos iguais a admin-auth.e2e.mjs (servidor + usuários temporários).
//   E2E_PASSWORD=<senha> node --env-file=.env.local tests/e2e/admin-settings.e2e.mjs
// Altera a linha singleton site_settings e RESTAURA os valores originais no fim.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { get, loginThroughForm, postForm, reporter, waitForServer } from "./http.mjs";
import { makePng } from "./fixtures.mjs";

const PW = process.env.E2E_PASSWORD;
if (!PW) throw new Error("Defina E2E_PASSWORD.");
const { check, finish } = reporter("E2E_SETTINGS");
await waitForServer();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const pub = createClient(URL_, KEY);
const text = (html) => html.replace(/<!-- -->/g, "");
const body = async (path) => text(await (await get(path)).text());
const stamp = Date.now().toString(36);

const jar = await loginThroughForm("e2e-admin@test.invalid", PW);
const admin = createServerClient(URL_, KEY, { cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll() {} } });

const columns = "company_name, professional_name, role, description, bio, email, phone, whatsapp, linkedin_url, github_url, instagram_url, location, service_area, profile_image";
const original = (await admin.from("site_settings").select(columns).eq("id", 1).single()).data;
check("configurações originais lidas", Boolean(original?.company_name), JSON.stringify(original?.company_name));

const page = await get("/admin/configuracoes", jar);
const pageHtml = text(await page.text());
check("página 200 com formulário e valores atuais", page.status === 200 && pageHtml.includes('data-form="settings"') && pageHtml.includes(`value="${original.company_name}"`), `${page.status}`);
check("aviso lista os contatos pendentes", pageHtml.includes("Campos públicos ainda sem preenchimento") && pageHtml.includes("WhatsApp"));

// Validação: nada é salvo
const asFields = (o = {}) => ({
  company_name: original.company_name, professional_name: original.professional_name, role: original.role,
  description: original.description, bio: original.bio ?? "", email: original.email ?? "", phone: original.phone ?? "",
  whatsapp: original.whatsapp ?? "", linkedin_url: original.linkedin_url ?? "", github_url: original.github_url ?? "",
  instagram_url: original.instagram_url ?? "", location: original.location, service_area: original.service_area, ...o
});
const invalid = await postForm("/admin/configuracoes", pageHtml, "settings", asFields({ company_name: "", email: "sem-arroba", whatsapp: "123", linkedin_url: "linkedin.com/x" }), jar);
const invalidHtml = text(await invalid.text());
check("inválido: mensagens por campo", invalid.status === 200 && invalidHtml.includes("Informe o nome da empresa.") && invalidHtml.includes("Informe um e-mail válido.") && invalidHtml.includes("DDD") && invalidHtml.includes("URL completa do LinkedIn"), `${invalid.status}`);
check("inválido não altera o banco", (await admin.from("site_settings").select("company_name").eq("id", 1).single()).data.company_name === original.company_name);

// Salvar contatos reais (os que estavam vazios) e ver no site
const email = `contato-${stamp}@exemplo.com.br`;
const whatsapp = "55 62 91234-5678";
const linkedin = `https://www.linkedin.com/in/e2e-${stamp}`;
const github = `https://github.com/e2e-${stamp}`;
const instagram = `https://www.instagram.com/e2e-${stamp}`;
const bio = `Primeiro parágrafo E2E ${stamp}.\n\nSegundo parágrafo E2E.`;
const saved = await postForm("/admin/configuracoes", pageHtml, "settings",
  asFields({ email, whatsapp, linkedin_url: linkedin, github_url: github, instagram_url: instagram, bio, role: `Cargo E2E ${stamp}` }), jar);
check("salvar: 200 com confirmação", saved.status === 200 && text(await saved.text()).includes("Configurações salvas."), `${saved.status}`);

const home = await body("/");
check("home mostra o cargo salvo", home.includes(`Cargo E2E ${stamp}`));
check("home mostra os parágrafos da bio", home.includes(`Primeiro parágrafo E2E ${stamp}.`) && home.includes("Segundo parágrafo E2E."));
check("rodapé lista LinkedIn, GitHub, Instagram e e-mail", home.includes(linkedin) && home.includes(github) && home.includes(instagram) && home.includes(`mailto:${email}`));
check("links de WhatsApp usam o número salvo", home.includes("https://wa.me/5562912345678"));
check("Schema.org inclui e-mail e redes", home.includes(`\\"email\\":\\"${email}\\"`) || home.includes(`"email":"${email}"`));
const projectsPage = await body("/projetos");
check("páginas internas também refletem as configurações", projectsPage.includes(linkedin) && projectsPage.includes("https://wa.me/5562912345678"));

// Foto profissional
const photoPage = await (await get("/admin/configuracoes", jar)).text();
check("formulário de foto presente", photoPage.includes('data-form="photo"') && text(photoPage).includes("Sem foto"));
const spoof = await postForm("/admin/configuracoes", photoPage, "photo", { intent: "upload", photo: new File(['<svg xmlns="http://www.w3.org/2000/svg"/>'], "foto.png", { type: "image/png" }) }, jar);
check("SVG disfarçado é recusado", text(await spoof.text()).includes("Use JPEG, PNG, WebP ou AVIF"));
const uploaded = await postForm("/admin/configuracoes", photoPage, "photo", { intent: "upload", photo: new File([makePng(600, 800)], "foto.png", { type: "image/png" }) }, jar);
check("upload da foto: confirmação", uploaded.status === 200 && text(await uploaded.text()).includes("Foto atualizada."), `${uploaded.status}`);
const photoPath = (await admin.from("site_settings").select("profile_image").eq("id", 1).single()).data.profile_image;
check("foto salva em settings/<uuid>", /^settings\/[0-9a-f-]{36}\.png$/.test(photoPath ?? ""), photoPath);
const served = await fetch(`${URL_}/storage/v1/object/public/portfolio/${photoPath}`);
check("foto acessível pela URL pública", served.status === 200 && served.headers.get("content-type") === "image/png", `${served.status}`);
const aboutHome = await body("/");
check("seção Sobre passa a exibir a foto", aboutHome.includes(encodeURIComponent(`${URL_}/storage/v1/object/public/portfolio/${photoPath}`)) && !aboutHome.includes("Configurável no painel"));

const removed = await postForm("/admin/configuracoes", await (await get("/admin/configuracoes", jar)).text(), "photo", { intent: "remove" }, jar);
check("remover foto: confirmação, coluna nula e objeto apagado", text(await removed.text()).includes("Foto removida.")
  && (await admin.from("site_settings").select("profile_image").eq("id", 1).single()).data.profile_image === null
  && ((await admin.storage.from("portfolio").list("settings")).data ?? []).length === 0);
check("placeholder volta na seção Sobre", (await body("/")).includes("Configurável no painel"));

// Não-admin e anônimo
const outside = new Map();
const user = createServerClient(URL_, KEY, {
  cookies: { getAll: () => [...outside].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => (value ? outside.set(name, value) : outside.delete(name))) }
});
await user.auth.signInWithPassword({ email: "e2e-user@test.invalid", password: PW });
const byUser = await postForm("/admin/configuracoes", pageHtml, "settings", asFields({ company_name: `Invadido ${stamp}` }), outside);
const byAnon = await postForm("/admin/configuracoes", pageHtml, "settings", asFields({ company_name: `Anon ${stamp}` }));
check("não-admin: action redireciona ao login", [303, 307].includes(byUser.status) && /\/admin\/login/.test(byUser.headers.get("location") ?? ""), `${byUser.status}`);
check("anônimo: proxy barra antes da action", byAnon.status === 307, `${byAnon.status}`);
await user.auth.signOut({ scope: "local" });
check("nome da empresa intacto após as tentativas", (await admin.from("site_settings").select("company_name").eq("id", 1).single()).data.company_name === original.company_name);

// Restaurar os valores originais pelo próprio formulário
const restore = await postForm("/admin/configuracoes", await (await get("/admin/configuracoes", jar)).text(), "settings", asFields(), jar);
check("restaurar: confirmação", text(await restore.text()).includes("Configurações salvas."));
const finalRow = (await admin.from("site_settings").select(columns).eq("id", 1).single()).data;
const changed = Object.keys(original).filter((key) => (original[key] ?? null) !== (finalRow[key] ?? null));
check("banco restaurado ao estado original", changed.length === 0, JSON.stringify(changed));
check("home volta ao conteúdo original", (await body("/")).includes(original.role) && !(await body("/")).includes(`Cargo E2E ${stamp}`));
check("sem objetos no Storage", ((await admin.storage.from("portfolio").list("settings")).data ?? []).length === 0);
check("contatos voltam a não aparecer", !(await body("/")).includes(`mailto:${email}`) && ((await pub.from("site_settings").select("email").eq("id", 1).single()).data.email ?? null) === (original.email ?? null));

finish();
