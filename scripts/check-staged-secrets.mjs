// Recusa o commit se algum arquivo preparado contiver credencial.
//
// Olha o conteúdo *staged* (não o do disco), que é o que realmente entraria no
// histórico. Sem dependências: roda com o Node puro, antes de qualquer npm
// install, porque um hook que não roda não protege nada.
import { execFileSync } from "node:child_process";

const patterns = [
  { name: "chave do Resend", regex: /(?<![A-Za-z0-9_])re_[A-Za-z0-9]{6,}_[A-Za-z0-9]{12,}/ },
  { name: "chave secreta do Supabase", regex: /(?<![A-Za-z0-9_])sb_secret_[A-Za-z0-9_-]{8,}/ },
  { name: "token JWT", regex: /(?<![A-Za-z0-9_])eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ }
];

/** Valores obviamente fictícios usados em teste e documentação. */
const placeholder = /do_not_leak|example|placeholder|fake|xxxx|seudominio/i;

const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

const staged = git(["diff", "--cached", "--name-only", "--diff-filter=ACM"])
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

const findings = [];
for (const file of staged) {
  let content;
  try {
    content = git(["show", `:${file}`]);
  } catch {
    continue; // binário ou removido do índice
  }
  if (content.includes("\u0000")) continue;

  content.split(/\r?\n/).forEach((line, index) => {
    for (const { name, regex } of patterns) {
      const match = regex.exec(line);
      if (match && !placeholder.test(match[0])) {
        findings.push(`${file}:${index + 1} — ${name}`);
      }
    }
  });
}

if (findings.length) {
  console.error("\nCommit recusado: credencial em arquivo versionado.\n");
  for (const finding of findings) console.error(`  ${finding}`);
  console.error(
    [
      "",
      "Valores reais vão no .env.local, que o Git ignora.",
      "O .env.example é um modelo versionado: só nomes de variável, sem valores.",
      "",
      "Se for um falso positivo, revise o padrão em scripts/check-staged-secrets.mjs.",
      ""
    ].join("\n")
  );
  process.exit(1);
}
