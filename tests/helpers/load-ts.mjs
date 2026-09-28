import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_only"
};

/** Objects created inside the vm context have another realm's prototype. */
export const plain = (value) => JSON.parse(JSON.stringify(value));

/**
 * Transpile a real TS module and run it in isolation. Only framework/SDK/network
 * dependencies are replaced via `mocks`; "@/..." and relative imports load the
 * real source files (with the same mocks).
 */
export function loadTs(file, { mocks = {}, env = publicEnv, globals = {} } = {}) {
  const filename = resolve(root, file);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const loaded = { exports: {} };
  runInNewContext(output, {
    exports: loaded.exports,
    module: loaded,
    process: { env },
    URL,
    Intl,
    console,
    ...globals,
    require(id) {
      if (id in mocks) return mocks[id];
      if (id === "zod") return require(id);
      if (id === "server-only" || id === "client-only") return {};
      // Imports carry no extension: prefer .ts and fall back to .tsx.
      const withExtension = (relative) =>
        existsSync(resolve(root, `${relative}.ts`)) ? `${relative}.ts` : `${relative}.tsx`;
      if (id.startsWith("@/")) return loadTs(withExtension(`src/${id.slice(2)}`), { mocks, env, globals });
      if (id.startsWith(".")) {
        return loadTs(withExtension(resolve(dirname(filename), id).slice(root.length + 1)), { mocks, env, globals });
      }
      throw new Error(`Unexpected dependency: ${id}`);
    }
  }, { filename });
  return loaded.exports;
}
