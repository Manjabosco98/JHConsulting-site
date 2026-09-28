import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { root } from "./helpers/load-ts.mjs";

/**
 * Static guards for the project's first rule: a secret never reaches the
 * browser and never gets versioned. These read the source tree instead of
 * running it, so they also cover files no other test loads.
 */

function sourceFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) sourceFiles(full, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

const files = sourceFiles(join(root, "src")).map((file) => ({
  path: relative(root, file).replaceAll("\\", "/"),
  text: readFileSync(file, "utf8")
}));

/** Variables that must never be readable from the browser. */
const serverOnlyNames = [
  "SUPABASE_SECRET_KEY",
  "RESEND_API_KEY",
  "CONTACT_FROM_EMAIL",
  "CONTACT_TO_EMAIL",
  "TURNSTILE_SECRET_KEY"
];

test("nenhuma variável pública tem nome de segredo", () => {
  const offenders = [];
  for (const file of files) {
    for (const match of file.text.matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) {
      if (/SECRET|SERVICE_ROLE|PRIVATE|PASSWORD/.test(match[0])) offenders.push(`${file.path}: ${match[0]}`);
    }
  }
  assert.deepEqual(offenders, [], "uma variável NEXT_PUBLIC_ é embutida no bundle do navegador");
});

/**
 * Só leitura conta. Citar o nome da variável é legítimo — o painel mostra
 * "SUPABASE_SECRET_KEY não está configurada" para o administrador, e isso é o
 * nome, não o valor.
 */
const readsEnv = (text, name) =>
  new RegExp(`process\\.env(\\.${name}\\b|\\[["']${name}["']\\])|readTrimmedEnv\\(["']${name}["']\\)`).test(text);

test("quem lê variável de servidor é server-only", () => {
  const offenders = [];
  for (const file of files) {
    const reads = serverOnlyNames.filter((name) => readsEnv(file.text, name));
    if (!reads.length) continue;
    // Route handlers never reach the browser; everything else declares it.
    const isRouteHandler = /^src\/app\/api\//.test(file.path);
    const declaresServerOnly = /^import ["']server-only["'];/m.test(file.text);
    if (!isRouteHandler && !declaresServerOnly) offenders.push(`${file.path}: ${reads.join(", ")}`);
  }
  assert.deepEqual(offenders, [], 'arquivo lê variável de servidor sem import "server-only"');
});

test("nenhum componente de cliente lê variável que não seja pública", () => {
  const offenders = [];
  for (const file of files) {
    if (!/^["']use client["'];/m.test(file.text)) continue;
    for (const match of file.text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      if (!match[1].startsWith("NEXT_PUBLIC_")) offenders.push(`${file.path}: ${match[1]}`);
    }
    // Num componente de cliente nem citar o nome se justifica.
    for (const name of serverOnlyNames) {
      if (file.text.includes(name)) offenders.push(`${file.path}: ${name}`);
    }
  }
  assert.deepEqual(offenders, [], "um componente de cliente referencia variável de servidor");
});

test("o cliente privilegiado só é importado por código de servidor", () => {
  const importers = files.filter(
    (file) => file.path !== "src/lib/supabase/secret.ts" && /@\/lib\/supabase\/secret/.test(file.text)
  );
  assert.ok(importers.length > 0, "o teste precisa encontrar quem usa o cliente privilegiado");
  for (const file of importers) {
    const allowed = /^src\/app\/api\//.test(file.path) || /^import ["']server-only["'];/m.test(file.text) || !/^["']use client["'];/m.test(file.text);
    assert.ok(allowed, `${file.path} importa o cliente privilegiado sem ser servidor`);
  }
});

// Esta é a verificação que pegaria a chave do Resend colada no arquivo errado.
test(".env.example tem só placeholders, nunca valores reais", () => {
  const example = readFileSync(join(root, ".env.example"), "utf8");
  const leaks = [];
  for (const line of example.split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const value = line.slice(line.indexOf("=") + 1).trim();
    if (!value) continue;
    // Formatos de credencial: Resend, chaves novas do Supabase e JWT legado.
    if (/^(re_[A-Za-z0-9_-]{8,}|sb_secret_\S+|sb_publishable_\S{8,}|eyJ[A-Za-z0-9_-]+\.)/.test(value)) {
      leaks.push(line.slice(0, line.indexOf("=")));
    }
  }
  assert.deepEqual(leaks, [], "há valor de credencial num arquivo versionado");
});

test("nenhum arquivo versionado de ambiente além do exemplo", () => {
  const ignore = readFileSync(join(root, ".gitignore"), "utf8");
  assert.match(ignore, /^\.env\*/m, ".gitignore precisa cobrir os arquivos .env");
});
