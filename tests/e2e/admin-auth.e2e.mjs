// E2E do Auth administrativo contra o Supabase Cloud real (Fase 5).
// Não roda em `npm test` (exige servidor e usuários temporários).
//
// 1. Criar pelo conector dois usuários temporários confirmados, com a mesma senha,
//    e tornar apenas o primeiro admin (SQL em docs/ADMIN-ARCHITECTURE.md):
//      e2e-admin@test.invalid  (em private.admin_users)
//      e2e-user@test.invalid   (sem admin)
// 2. npm run build && npx next start --hostname 127.0.0.1 --port 3431
// 3. E2E_PASSWORD=<senha> node --env-file=.env.local tests/e2e/admin-auth.e2e.mjs
// 4. Apagar os usuários: delete from auth.users where email like 'e2e-%@test.invalid';
import { authCookies, get, jarFrom, postForm, reporter, waitForServer } from "./http.mjs";

const PW = process.env.E2E_PASSWORD;
if (!PW) throw new Error("Defina E2E_PASSWORD.");
const { check, finish } = reporter("E2E_AUTH");
await waitForServer();

// 1. Site público intacto
const home = await get("/");
check("home 200 e sem X-Robots-Tag", home.status === 200 && !home.headers.get("x-robots-tag"));
const robots = await (await get("/robots.txt")).text();
check("robots.txt bloqueia /admin", /Disallow: \/admin/.test(robots), robots);

// 2. Anônimo
const anon = await get("/admin");
check("anon /admin -> 307 /admin/login", anon.status === 307 && anon.headers.get("location")?.endsWith("/admin/login"), `${anon.status} ${anon.headers.get("location")}`);
check("anon /admin noindex (header)", anon.headers.get("x-robots-tag") === "noindex, nofollow");
const deep = await get("/admin/projetos/qualquer");
check("anon rota profunda -> 307 /admin/login", deep.status === 307 && deep.headers.get("location")?.endsWith("/admin/login"));
const loginRes = await get("/admin/login");
const loginHtml = await loginRes.text();
check("login 200 com formulário", loginRes.status === 200 && /name="email"/.test(loginHtml) && /name="password"/.test(loginHtml));
check("login meta robots noindex", /<meta name="robots" content="noindex, nofollow"/.test(loginHtml));
check("login cache privado/no-store ou dinâmico", !/s-maxage/.test(loginRes.headers.get("cache-control") ?? ""), loginRes.headers.get("cache-control"));

// 3. Senha errada
const wrong = await postForm("/admin/login", loginHtml, null, { email: "e2e-admin@test.invalid", password: "senha-errada" });
const wrongHtml = await wrong.text();
check("senha errada: mensagem genérica, sem cookie", wrong.status === 200 && wrongHtml.includes("E-mail ou senha incorretos.") && authCookies(jarFrom(wrong)).length === 0, `${wrong.status}`);

// 4. Usuário sem admin via formulário
const nonAdmin = await postForm("/admin/login", loginHtml, null, { email: "e2e-user@test.invalid", password: PW });
const nonAdminHtml = await nonAdmin.text();
check("não-admin: recusado e sem sessão", nonAdmin.status === 200 && nonAdminHtml.includes("não tem acesso ao painel") && authCookies(jarFrom(nonAdmin)).length === 0, `${nonAdmin.status} ${authCookies(jarFrom(nonAdmin))}`);

// 5. Não-admin com sessão válida obtida por fora (burla o formulário) -> servidor bloqueia
const { createServerClient } = await import("@supabase/ssr");
const outside = new Map();
const direct = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  cookies: { getAll: () => [...outside].map(([name, value]) => ({ name, value })), setAll: (cs) => cs.forEach(({ name, value }) => value ? outside.set(name, value) : outside.delete(name)) }
});
const { error: directErr } = await direct.auth.signInWithPassword({ email: "e2e-user@test.invalid", password: PW });
check("sessão não-admin criada fora do app", !directErr && authCookies(outside).length > 0, directErr?.message);
const forbidden = await get("/admin", outside);
check("não-admin com sessão: /admin -> 307 /admin/login", forbidden.status === 307 && forbidden.headers.get("location")?.endsWith("/admin/login"), `${forbidden.status}`);
const forbiddenLogin = await (await get("/admin/login", outside)).text();
check("não-admin vê aviso de conta sem acesso", forbiddenLogin.includes("não tem acesso ao painel") && forbiddenLogin.includes("e2e-user@test.invalid"));
await direct.auth.signOut({ scope: "local" });

// 6. Admin via formulário
const ok = await postForm("/admin/login", loginHtml, null, { email: "e2e-admin@test.invalid", password: PW });
const jar = jarFrom(ok);
check("admin: 303 -> /admin com cookie de sessão", ok.status === 303 && ok.headers.get("location")?.endsWith("/admin") && authCookies(jar).length > 0, `${ok.status} ${ok.headers.get("location")}`);
const setCookie = ok.headers.getSetCookie().find((c) => /auth-token/.test(c)) ?? "";
check("cookie com SameSite=Lax e Path=/", /samesite=lax/i.test(setCookie) && /path=\//i.test(setCookie), setCookie.replace(/=[^;]{20,}/, "=<redacted>"));
check("resposta de login com Cache-Control no-store", /no-store/.test(ok.headers.get("cache-control") ?? ""), ok.headers.get("cache-control"));
const panel = await get("/admin", jar);
const panelHtml = await panel.text();
check("admin /admin 200 com dashboard", panel.status === 200 && panelHtml.includes("<h1") && panelHtml.includes("Dashboard") && panelHtml.includes("e2e-admin@test.invalid"), `${panel.status}`);
check("painel noindex", /<meta name="robots" content="noindex, nofollow"/.test(panelHtml));

// 6b. Admin base (Fase 6): navegação, números reais e seções protegidas
const sections = ["/admin/projetos", "/admin/servicos", "/admin/tecnologias", "/admin/contatos", "/admin/configuracoes"];
check("sidebar com as 6 entradas", ["/admin", ...sections].every((href) => panelHtml.includes(`href="${href}"`)));
check("dashboard marcado como página atual", /aria-current="page"[^>]*href="\/admin"|href="\/admin"[^>]*aria-current="page"/.test(panelHtml));
const { createClient } = await import("@supabase/supabase-js");
const pub = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const publicCount = async (table, filter) => (await filter(pub.from(table).select("id", { count: "exact", head: true }))).count;
const published = await publicCount("projects", (q) => q.eq("published", true));
const activeServices = await publicCount("services", (q) => q.eq("active", true));
const activeTechs = await publicCount("technologies", (q) => q.eq("active", true));
const text = panelHtml.replace(/<!-- -->/g, "");
check(`dashboard mostra ${published} projetos publicados`, text.includes(`${published} publicados`));
check(`dashboard mostra ${activeServices} serviços ativos`, text.includes(`${activeServices} ativos`));
check(`dashboard mostra ${activeTechs} tecnologias ativas`, text.includes(`${activeTechs} ativas`));
check("dashboard aponta campos públicos pendentes", text.includes("Campos públicos sem preenchimento") || text.includes("Informações de contato completas"));
for (const path of sections) {
  const page = await get(path, jar);
  const html = page.status === 200 ? await page.text() : "";
  const anonPage = await get(path);
  check(`${path}: admin 200 com item ativo; anon 307`, page.status === 200 && html.includes('aria-current="page"') && anonPage.status === 307, `${page.status}/${anonPage.status}`);
}
const loginWhileAdmin = await get("/admin/login", jar);
check("admin em /admin/login -> redireciona para /admin", [303, 307].includes(loginWhileAdmin.status) && loginWhileAdmin.headers.get("location")?.endsWith("/admin"), `${loginWhileAdmin.status}`);

// 7. Logout
const logoutRes = await postForm("/admin", panelHtml, "logout", {}, jar);
jarFrom(logoutRes, jar);
check("logout: 303 -> /admin/login e cookies removidos", logoutRes.status === 303 && logoutRes.headers.get("location")?.endsWith("/admin/login") && authCookies(jar).length === 0, `${logoutRes.status} ${logoutRes.headers.get("location")} ${authCookies(jar)}`);
const after = await get("/admin", jar);
check("após logout: /admin -> 307 /admin/login", after.status === 307);

finish();
