// E2E do Storage (Fase 8): capa de projeto com uploads reais no bucket "portfolio".
// Pré-requisitos iguais a admin-auth.e2e.mjs (servidor + usuários temporários).
//   E2E_PASSWORD=<senha> node --env-file=.env.local tests/e2e/admin-storage.e2e.mjs
// Cria um projeto rascunho temporário (slug e2e-capa-*) e o exclui no fim.
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { BASE, get, loginThroughForm, postForm, reporter, waitForServer } from "./http.mjs";
import { makePng } from "./fixtures.mjs";

const PW = process.env.E2E_PASSWORD;
if (!PW) throw new Error("Defina E2E_PASSWORD.");
const { check, finish } = reporter("E2E_STORAGE");
await waitForServer();

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const publicUrl = (path) => `${URL_}/storage/v1/object/public/portfolio/${path}`;
const sessionClient = (jar, writable = false) => createServerClient(URL_, KEY, {
  cookies: {
    getAll: () => [...jar].map(([name, value]) => ({ name, value })),
    setAll: (cs) => { if (writable) cs.forEach(({ name, value }) => (value ? jar.set(name, value) : jar.delete(name))); }
  }
});
const text = (html) => html.replace(/<!-- -->/g, "");
const stamp = Date.now().toString(36);

const jar = await loginThroughForm("e2e-admin@test.invalid", PW);
const admin = sessionClient(jar);

// Projeto temporário
const newHtml = await (await get("/admin/projetos/novo", jar)).text();
const created = await postForm("/admin/projetos/novo", newHtml, "project", {
  title: `E2E Capa ${stamp}`, slug: `e2e-capa-${stamp}`, category: "Teste", status: "", short_description: "",
  description: "", problem: "", solution: "", repository_url: "", demo_url: "", display_order: "0", visibility: "draft", technology_ids: []
}, jar);
const id = /\/admin\/projetos\/([0-9a-f-]{36})/.exec(created.headers.get("location") ?? "")?.[1];
check("projeto temporário criado", Boolean(id), `${created.status}`);
const editPath = `/admin/projetos/${id}`;
const coverOf = async () => (await admin.from("projects").select("cover_image").eq("id", id).single()).data?.cover_image ?? null;
const folder = async () => ((await admin.storage.from("portfolio").list(`projects/${id}`)).data ?? []).map((o) => o.name);

let html = await (await get(editPath, jar)).text();
check("edição mostra formulário de capa vazio", html.includes('data-form="cover"') && text(html).includes("Sem capa"));

// Upload válido
const first = makePng(1200, 630);
const upload = async (file, intent = "upload") => {
  html = await (await get(editPath, jar)).text();
  const res = await postForm(editPath, html, "cover", { intent, ...(file ? { cover: file } : {}) }, jar);
  return { res, body: text(await res.text()) };
};
const ok = await upload(new File([first], "capa.png", { type: "image/png" }));
const path1 = await coverOf();
check("upload válido: mensagem de sucesso", ok.res.status === 200 && ok.body.includes("Capa atualizada."), `${ok.res.status}`);
check("caminho imutável por projeto", new RegExp(`^projects/${id}/[0-9a-f-]{36}\\.png$`).test(path1 ?? ""), path1);
const served = await fetch(publicUrl(path1));
const servedBytes = Buffer.from(await served.arrayBuffer());
check("URL pública serve a imagem enviada", served.status === 200 && served.headers.get("content-type") === "image/png" && servedBytes.equals(first), `${served.status} ${served.headers.get("content-type")}`);
check("cache longo (objeto imutável)", /max-age=31536000/.test(served.headers.get("cache-control") ?? ""), served.headers.get("cache-control"));
html = await (await get(editPath, jar)).text();
check("painel exibe a capa via next/image", html.includes(encodeURIComponent(publicUrl(path1))));

// next/image: domínio do Supabase permitido; outros bloqueados
const optimized = await fetch(`${BASE}/_next/image?url=${encodeURIComponent(publicUrl(path1))}&w=640&q=75`);
check("otimização next/image do Storage", optimized.status === 200 && /^image\//.test(optimized.headers.get("content-type") ?? ""), `${optimized.status}`);
const foreign = await fetch(`${BASE}/_next/image?url=${encodeURIComponent("https://example.com/x.png")}&w=640&q=75`);
check("next/image recusa domínio externo", foreign.status === 400, `${foreign.status}`);

// Arquivos inválidos não alteram nada
const svg = new File(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], "foto.png", { type: "image/png" });
const spoof = await upload(svg);
check("SVG disfarçado de PNG é recusado", spoof.body.includes("Use JPEG, PNG, WebP ou AVIF") && (await coverOf()) === path1);
const big = makePng(1500, 1200, { noise: true });
const tooBig = await upload(new File([big], "grande.png", { type: "image/png" }));
check(`imagem de ${(big.length / 1048576).toFixed(1)} MB é recusada`, big.length > 5 * 1048576 && tooBig.body.includes("no máximo 5 MB") && (await coverOf()) === path1);
const empty = await upload(null);
check("envio sem arquivo é recusado", empty.body.includes("Selecione uma imagem."));

// Substituição remove a anterior
const second = makePng(1200, 630, { pixel: (x) => [34, 211 - Math.round(x / 10), 238] });
await upload(new File([second], "nova.png", { type: "image/png" }));
const path2 = await coverOf();
const files = await folder();
check("substituição aponta para novo objeto", Boolean(path2) && path2 !== path1);
check("objeto anterior removido do bucket", files.length === 1 && path2.endsWith(files[0]), JSON.stringify(files));

// Acesso direto à Storage API sem ser admin
const anonClient = createClient(URL_, KEY);
const anonUpload = await anonClient.storage.from("portfolio").upload(`projects/${id}/anon.png`, first, { contentType: "image/png" });
check("anônimo não envia pela Storage API", Boolean(anonUpload.error));
const anonList = await anonClient.storage.from("portfolio").list(`projects/${id}`);
check("anônimo não lista o bucket", (anonList.data ?? []).length === 0);
const anonDelete = await anonClient.storage.from("portfolio").remove([path2]);
check("anônimo não remove objetos", (await fetch(publicUrl(path2))).status === 200 && (anonDelete.data ?? []).length === 0);
const userJar = new Map();
const user = sessionClient(userJar, true);
await user.auth.signInWithPassword({ email: "e2e-user@test.invalid", password: PW });
const userUpload = await user.storage.from("portfolio").upload(`projects/${id}/user.png`, first, { contentType: "image/png" });
const userDelete = await user.storage.from("portfolio").remove([path2]);
check("usuário não-admin não envia nem remove", Boolean(userUpload.error) && (userDelete.data ?? []).length === 0 && (await folder()).length === 1);
await user.auth.signOut({ scope: "local" });
const adminSvg = await admin.storage.from("portfolio").upload(`projects/${id}/x.svg`, Buffer.from("<svg/>"), { contentType: "image/svg+xml" });
check("bucket recusa SVG mesmo para admin (allowed_mime_types)", Boolean(adminSvg.error), adminSvg.error?.message);

// Remover capa
const removed = await upload(null, "remove");
check("remover capa: mensagem, coluna nula e bucket vazio", removed.body.includes("Capa removida.") && (await coverOf()) === null && (await folder()).length === 0);

// Excluir projeto limpa a pasta
await upload(new File([first], "capa.png", { type: "image/png" }));
check("nova capa antes da exclusão", (await folder()).length === 1);
html = await (await get(editPath, jar)).text();
const deleted = await postForm(editPath, html, "delete-project", {}, jar);
check("projeto excluído", deleted.status === 303);
check("exclusão do projeto remove a pasta no Storage", (await folder()).length === 0);

finish();
