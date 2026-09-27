import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = resolve(dirname(fileURLToPath(import.meta.url)), "../scripts/generate-supabase-types.mjs");

async function fixture(t, cliSource, projectId = "exampleprojectrefonly") {
  const temporaryRoot = resolve(tmpdir());
  const root = resolve(await mkdtemp(join(temporaryRoot, "jh-types-test-")));
  assert.ok(root.startsWith(`${temporaryRoot}${sep}jh-types-test-`));
  t.after(() => rm(root, { recursive: true, force: true }));
  const destination = join(root, "src/types/database.ts");
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, "original types\n");
  const cli = join(root, "mock-npm.cjs");
  await writeFile(cli, cliSource);
  const result = spawnSync(process.execPath, [script], {
    cwd: root, encoding: "utf8", env: { ...process.env, npm_execpath: cli, SUPABASE_PROJECT_ID: projectId }
  });
  return { result, content: await readFile(destination, "utf8") };
}

test("CLI failure never truncates the existing database types", async (t) => {
  const { result, content } = await fixture(t, "process.exit(1)");
  assert.notEqual(result.status, 0);
  assert.equal(content, "original types\n");
});

test("missing Cloud project ref fails without invoking the CLI or modifying types", async (t) => {
  const { result, content } = await fixture(t, "throw Error('CLI must not run')", "");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Defina SUPABASE_PROJECT_ID/);
  assert.equal(content, "original types\n");
});

test("type generation targets only the explicit Cloud project and public schema", async (t) => {
  const { result } = await fixture(t, `
    const assert = require('node:assert/strict');
    assert.deepEqual(process.argv.slice(2), [
      'exec', '--no', '--', 'supabase', 'gen', 'types', 'typescript',
      '--project-id', 'exampleprojectrefonly', '--schema', 'public'
    ]);
    console.log('export type Database = {};');
  `);
  assert.equal(result.status, 0, result.stderr);
});

test("empty or unexpected CLI output never overwrites the existing types", async (t) => {
  const { result, content } = await fixture(t, "console.log('not database types')");
  assert.notEqual(result.status, 0);
  assert.equal(content, "original types\n");
});

test("successful CLI output is saved in UTF-8 without BOM", async (t) => {
  const { result, content } = await fixture(t, "console.log('export type Database = { /* configuração */ };')");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(content, "export type Database = { /* configuração */ };\n");
  assert.notEqual(content.charCodeAt(0), 0xfeff);
});
