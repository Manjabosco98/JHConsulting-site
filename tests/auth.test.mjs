import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";

const load = (file, mocks = {}) => loadTs(file, { mocks });

class Redirect extends Error {
  constructor(url) { super(`redirect:${url}`); this.url = url; }
}
const navigation = { redirect: (url) => { throw new Redirect(url); } };

function fakeSupabase({ sub = "user-1", email = "a@b.co", claimsError = null, isAdmin = true, rpcError = null, signInError = null } = {}) {
  const calls = [];
  return {
    calls,
    auth: {
      getClaims: async () => ({ data: sub ? { claims: { sub, email } } : null, error: claimsError }),
      signInWithPassword: async (credentials) => { calls.push(["signIn", credentials]); return { error: signInError }; },
      signOut: async (options) => { calls.push(["signOut", options]); return { error: null }; }
    },
    rpc: async (name) => { calls.push(["rpc", name]); return { data: rpcError ? null : isAdmin, error: rpcError }; }
  };
}

function loadAdmin(client) {
  return load("src/lib/auth/admin.ts", {
    react: { cache: (fn) => fn },
    "next/navigation": navigation,
    "@/lib/supabase/server": { createClient: async () => client }
  });
}

function loadActions(client) {
  return load("src/app/admin/actions.ts", {
    "next/navigation": navigation,
    "@/lib/supabase/server": { createClient: async () => client }
  });
}

// O login registra a causa real da falha no servidor (Fase 21). Aqui o console
// é coletado: mantém a saída da suíte limpa e permite verificar o que foi (e o
// que não foi) registrado.
const captureErrors = async (run) => {
  const original = console.error;
  const logs = [];
  console.error = (...args) => logs.push(args);
  try {
    return { result: await run(), logs };
  } finally {
    console.error = original;
  }
};

const form = (fields) => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => data.set(key, value));
  return data;
};

test("proxy routing: only sessionless /admin pages go to login; login and public site are untouched", () => {
  const { resolveAdminRedirect } = load("src/lib/auth/admin-routes.ts");
  assert.equal(resolveAdminRedirect("/admin", false), "/admin/login");
  assert.equal(resolveAdminRedirect("/admin/projetos/123", false), "/admin/login");
  assert.equal(resolveAdminRedirect("/admin", true), null);
  assert.equal(resolveAdminRedirect("/admin/login", false), null);
  for (const path of ["/", "/projetos", "/administrador", "/admin-login"]) {
    assert.equal(resolveAdminRedirect(path, false), null, path);
  }
});

test("auth state: anonymous, forbidden, admin; RPC failure fails closed", async () => {
  assert.deepEqual(plain(await loadAdmin(fakeSupabase({ sub: null })).getAuthState()), { status: "anonymous" });
  assert.deepEqual(plain(await loadAdmin(fakeSupabase({ claimsError: new Error("jwt") })).getAuthState()), { status: "anonymous" });
  assert.deepEqual(plain(await loadAdmin(fakeSupabase({ isAdmin: false })).getAuthState()), { status: "forbidden", email: "a@b.co" });
  assert.deepEqual(plain(await loadAdmin(fakeSupabase({ rpcError: { message: "boom" } })).getAuthState()), { status: "forbidden", email: "a@b.co" });
  assert.deepEqual(plain(await loadAdmin(fakeSupabase()).getAuthState()), { status: "admin", session: { userId: "user-1", email: "a@b.co" } });
});

test("requireAdmin redirects non-admins to login and returns the admin session", async () => {
  for (const options of [{ sub: null }, { isAdmin: false }, { rpcError: { message: "x" } }]) {
    await assert.rejects(loadAdmin(fakeSupabase(options)).requireAdmin(), (error) => error.url === "/admin/login");
  }
  assert.deepEqual(plain(await loadAdmin(fakeSupabase()).requireAdmin()), { userId: "user-1", email: "a@b.co" });
});

test("login: invalid input never reaches Supabase", async () => {
  const client = fakeSupabase();
  const { login } = loadActions(client);
  for (const fields of [{ email: "not-an-email", password: "x" }, { email: "a@b.co", password: "" }, {}]) {
    const state = await login({ error: null, email: "" }, form(fields));
    assert.match(state.error, /válidos/);
  }
  assert.equal(client.calls.length, 0);
});

test("login: wrong credentials get a generic message; rate limit is explained", async () => {
  const signIn = (signInError, fields) =>
    captureErrors(() =>
      loadActions(fakeSupabase({ signInError })).login({ error: null, email: "" }, form(fields)));

  const wrong = await signIn(
    { status: 400, code: "invalid_credentials", name: "AuthApiError" },
    { email: " A@B.co ", password: "secret" }
  );
  assert.deepEqual(plain(wrong.result), { error: "E-mail ou senha incorretos.", email: "a@b.co" });
  // A tela continua genérica, mas o servidor registra a causa real: é o que
  // separa senha errada de conta sem identity em auth.identities.
  assert.equal(wrong.logs.length, 1);
  assert.ok(wrong.logs[0][0].startsWith("[admin/login]"), wrong.logs[0][0]);
  assert.deepEqual(plain(wrong.logs[0][1]), { status: 400, code: "invalid_credentials", name: "AuthApiError" });
  // O log não pode carregar identificador nem credencial.
  const logged = JSON.stringify(plain(wrong.logs));
  assert.ok(!logged.includes("a@b.co") && !logged.includes("secret"), logged);

  const limited = await signIn({ status: 429 }, { email: "a@b.co", password: "secret" });
  assert.match(limited.result.error, /Muitas tentativas/);
  assert.equal(limited.logs.length, 1);
});

test("login: valid non-admin is signed out immediately", async () => {
  const client = fakeSupabase({ isAdmin: false });
  const denied = await captureErrors(() =>
    loadActions(client).login({ error: null, email: "" }, form({ email: "a@b.co", password: "secret" })));
  assert.match(denied.result.error, /não tem acesso/);
  assert.deepEqual(client.calls.map(([name]) => name), ["signIn", "rpc", "signOut"]);
  assert.deepEqual(plain(client.calls[2][1]), { scope: "local" });
  // Conta autenticada sem permissão é caminho previsto: nada a registrar.
  assert.equal(denied.logs.length, 0);

  // Já um RPC quebrado é defeito de infraestrutura e tem de aparecer no log,
  // ainda que a tela mostre a mesma mensagem.
  const broken = await captureErrors(() =>
    loadActions(fakeSupabase({ rpcError: { code: "42501", message: "permission denied" } }))
      .login({ error: null, email: "" }, form({ email: "a@b.co", password: "secret" })));
  assert.match(broken.result.error, /não tem acesso/);
  assert.equal(broken.logs.length, 1);
  assert.ok(broken.logs[0][0].includes("RPC is_admin"), broken.logs[0][0]);
});

test("login: admin is redirected to /admin; password is passed only to Supabase", async () => {
  const client = fakeSupabase();
  await assert.rejects(
    loadActions(client).login({ error: null, email: "" }, form({ email: "a@b.co", password: "secret" })),
    (error) => error.url === "/admin"
  );
  assert.deepEqual(plain(client.calls[0]), ["signIn", { email: "a@b.co", password: "secret" }]);
});

// Fase 18: escopo "global" revoga os refresh tokens no servidor, não só os
// cookies. Um token capturado antes do logout deixa de poder ser renovado.
test("logout revokes the session on the server and returns to login", async () => {
  const client = fakeSupabase();
  await assert.rejects(loadActions(client).logout(), (error) => error.url === "/admin/login");
  assert.deepEqual(plain(client.calls), [["signOut", { scope: "global" }]]);
});

// Já o login de uma conta sem permissão encerra apenas a sessão local: a conta
// é de quem se autenticou, e não há motivo para derrubá-la em outros aparelhos.
test("login: conta sem permissão é deslogada localmente, não globalmente", async () => {
  const client = fakeSupabase({ isAdmin: false });
  const state = plain(await loadActions(client).login({ error: null, email: "" }, form({ email: "a@b.co", password: "x" })));
  assert.match(state.error, /não tem acesso/);
  assert.deepEqual(plain(client.calls.at(-1)), ["signOut", { scope: "local" }]);
});

test("proxy refreshes cookies with no-cache headers and keeps them on the login redirect", async () => {
  const setCookies = [];
  class FakeResponse {
    constructor(kind, target) {
      this.kind = kind; this.target = target;
      const store = new Map();
      this.cookies = {
        set: (nameOrCookie, value, options) => {
          const cookie = typeof nameOrCookie === "string" ? { name: nameOrCookie, value, ...options } : nameOrCookie;
          store.set(cookie.name, cookie); setCookies.push([kind, cookie.name]);
        },
        getAll: () => [...store.values()]
      };
      this.headers = new Headers();
    }
    static next() { return new FakeResponse("next"); }
    static redirect(url) { return new FakeResponse("redirect", url.pathname); }
  }
  const makeProxy = (claims) => load("src/proxy.ts", {
    "next/server": { NextResponse: FakeResponse },
    "@supabase/ssr": {
      createServerClient: (_url, _key, { cookies }) => ({
        auth: {
          getClaims: async () => {
            cookies.setAll([{ name: "sb-auth", value: "refreshed", options: { path: "/" } }], { "Cache-Control": "private, no-store", Expires: "0" });
            return { data: claims ? { claims } : null, error: null };
          }
        }
      })
    }
  });
  const request = (pathname) => ({
    url: `https://site.test${pathname}`,
    nextUrl: { pathname },
    cookies: { getAll: () => [], set() {} }
  });

  const anonymous = await makeProxy(null).proxy(request("/admin"));
  assert.equal(anonymous.kind, "redirect");
  assert.equal(anonymous.target, "/admin/login");
  assert.equal(anonymous.cookies.getAll()[0].value, "refreshed");
  assert.equal(anonymous.headers.get("cache-control"), "private, no-store");
  assert.equal(anonymous.headers.get("x-robots-tag"), "noindex, nofollow");

  const signedIn = await makeProxy({ sub: "user-1" }).proxy(request("/admin"));
  assert.equal(signedIn.kind, "next");
  assert.equal(signedIn.headers.get("cache-control"), "private, no-store");

  const loginPage = await makeProxy(null).proxy(request("/admin/login"));
  assert.equal(loginPage.kind, "next");
});
