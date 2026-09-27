import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only"
};

// Exercise the real factories/config parser while replacing only framework/SDK I/O.
function load(file, env = {}, mocks = {}) {
  const filename = resolve(root, file);
  const source = readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const loadedModule = { exports: {} };
  runInNewContext(output, {
    exports: loadedModule.exports,
    module: loadedModule,
    process: { env },
    require(id) {
      if (id in mocks) return mocks[id];
      if (id === "./env") return load("src/lib/supabase/env.ts", env);
      if (id === "zod") return require(id);
      throw new Error(`Unexpected dependency: ${id}`);
    }
  }, { filename });
  return loadedModule.exports;
}

test("importing configuration requires no env; calling a client does", () => {
  const config = load("src/lib/supabase/env.ts");
  assert.throws(() => config.getSupabasePublicConfig(), /NEXT_PUBLIC_SUPABASE_URL/);
});

test("public configuration accepts hosted HTTPS", () => {
  for (const url of [publicEnv.NEXT_PUBLIC_SUPABASE_URL, "https://api.example.com"]) {
    const config = load("src/lib/supabase/env.ts", { ...publicEnv, NEXT_PUBLIC_SUPABASE_URL: url });
    assert.equal(config.getSupabasePublicConfig().url, url);
  }
});

test("invalid URLs and empty settings fail before constructing a client", () => {
  for (const value of ["", "invalid", "ftp://example.com", "javascript:alert(1)", "http://127.0.0.1:54321"]) {
    const config = load("src/lib/supabase/env.ts", { ...publicEnv, NEXT_PUBLIC_SUPABASE_URL: value });
    assert.throws(() => config.getSupabasePublicConfig(), /NEXT_PUBLIC_SUPABASE_URL/);
  }
});

test("privileged/legacy keys cannot be accidentally used as publishable keys", () => {
  for (const key of ["sb_secret_do_not_leak", "legacy.jwt.token", "", "   "]) {
    const config = load("src/lib/supabase/env.ts", {
      ...publicEnv, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key
    });
    assert.throws(() => config.getSupabasePublicConfig(), (error) => {
      assert.match(error.message, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
      if (key.trim()) assert.equal(error.message.includes(key), false);
      return true;
    });
  }
});

test("browser factory is lazy and passes only public configuration", () => {
  const calls = [];
  const client = {};
  const browser = load("src/lib/supabase/client.ts", {
    ...publicEnv, SUPABASE_SECRET_KEY: "must-not-be-used"
  }, {
    "client-only": {},
    "@supabase/ssr": { createBrowserClient: (...args) => { calls.push(args); return client; } }
  });
  assert.equal(calls.length, 0);
  assert.equal(browser.createClient(), client);
  assert.deepEqual(calls[0], [publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY]);
});

test("invalid configuration never reaches the browser SDK", () => {
  let called = false;
  const browser = load("src/lib/supabase/client.ts", {}, {
    "client-only": {},
    "@supabase/ssr": { createBrowserClient: () => { called = true; } }
  });
  assert.throws(() => browser.createClient(), /Configuração Supabase/);
  assert.equal(called, false);
});

test("server clients and cookie stores are isolated per request", async () => {
  let count = 0;
  const writes = [];
  const server = load("src/lib/supabase/server.ts", publicEnv, {
    "server-only": {},
    "next/headers": { cookies: async () => {
      const requestId = ++count;
      return {
        getAll: () => [{ name: "session", value: String(requestId) }],
        set: (...args) => writes.push({ requestId, args })
      };
    } },
    "@supabase/ssr": { createServerClient: (url, key, options) => ({ url, key, options }) }
  });
  const first = await server.createClient();
  const second = await server.createClient();
  assert.notEqual(first, second);
  assert.equal(first.key, publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  assert.equal(first.options.cookies.getAll()[0].value, "1");
  assert.equal(second.options.cookies.getAll()[0].value, "2");
  const cookieOptions = { path: "/", sameSite: "lax", maxAge: 60 };
  first.options.cookies.setAll([{ name: "session", value: "updated", options: cookieOptions }]);
  assert.deepEqual(writes, [{ requestId: 1, args: ["session", "updated", cookieOptions] }]);
});

test("read-only Server Component cookies do not crash the factory adapter", async () => {
  const server = load("src/lib/supabase/server.ts", publicEnv, {
    "server-only": {},
    "next/headers": { cookies: async () => ({ getAll: () => [], set() { throw new Error("read-only"); } }) },
    "@supabase/ssr": { createServerClient: (_url, _key, options) => options }
  });
  const client = await server.createClient();
  assert.doesNotThrow(() => client.cookies.setAll([{ name: "session", value: "value", options: {} }]));
});
