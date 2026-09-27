import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

// This project only uses Supabase Cloud. Never fall back to a local database.
const projectId = process.env.SUPABASE_PROJECT_ID?.trim();
if (!projectId || !/^[a-z0-9-]+$/.test(projectId)) {
  throw new Error("Defina SUPABASE_PROJECT_ID com o project ref do Supabase Cloud.");
}

// Run via npm so this works on Windows without shell redirection or UTF-16 output.
const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error("Execute npm run supabase:types.");
}

const result = spawnSync(
  process.execPath,
  [npmCli, "exec", "--no", "--", "supabase", "gen", "types", "typescript", "--project-id", projectId, "--schema", "public"],
  { encoding: "utf8", maxBuffer: 10 * 1024 * 1024, stdio: ["ignore", "pipe", "inherit"] }
);

if (result.error || result.status !== 0) {
  throw new Error("Não foi possível gerar os tipos. O arquivo anterior foi preservado.");
}

if (!result.stdout.includes("export type Database =")) {
  throw new Error("A CLI não retornou um tipo Database válido. O arquivo anterior foi preservado.");
}

const destination = resolve("src/types/database.ts");
const temporary = `${destination}.${randomUUID()}.tmp`;
await mkdir(dirname(destination), { recursive: true });
try {
  await writeFile(temporary, result.stdout, { encoding: "utf8", flag: "wx" });
  await rename(temporary, destination);
} finally {
  await rm(temporary, { force: true });
}
console.log("Tipos atualizados em src/types/database.ts.");
