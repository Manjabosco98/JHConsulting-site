import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const OLD_PATH = `projects/${PROJECT_ID}/44444444-4444-4444-8444-444444444444.png`;

const bytes = (...values) => new Uint8Array(values);
const ascii = (text) => [...text].map((c) => c.charCodeAt(0));
const samples = {
  jpeg: bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10),
  png: bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d),
  webp: bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBPVP8 ")),
  avif: bytes(0, 0, 0, 0x1c, ...ascii("ftypavif"), 0, 0),
  svg: bytes(...ascii('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')),
  html: bytes(...ascii("<!doctype html><html>")),
  pdf: bytes(...ascii("%PDF-1.7"))
};

const images = () => loadTs("src/lib/storage/images.ts", { globals: { Blob, crypto } });

test("image kind is detected by content, never by name or declared type", () => {
  const { detectImageKind } = images();
  assert.deepEqual(plain(detectImageKind(samples.jpeg)), { mime: "image/jpeg", extension: "jpg" });
  assert.deepEqual(plain(detectImageKind(samples.png)), { mime: "image/png", extension: "png" });
  assert.deepEqual(plain(detectImageKind(samples.webp)), { mime: "image/webp", extension: "webp" });
  assert.deepEqual(plain(detectImageKind(samples.avif)), { mime: "image/avif", extension: "avif" });
  for (const name of ["svg", "html", "pdf"]) assert.equal(detectImageKind(samples[name]), null, name);
  assert.equal(detectImageKind(bytes()), null);
  assert.equal(detectImageKind(bytes(0xff, 0xd8)), null);
});

test("file validation: required, size limit and spoofed files", async () => {
  const { validateImageFile, MAX_IMAGE_BYTES } = images();
  assert.equal((await validateImageFile(null)).error, "Selecione uma imagem.");
  assert.equal((await validateImageFile("text")).error, "Selecione uma imagem.");
  assert.equal((await validateImageFile(new Blob([]))).error, "Selecione uma imagem.");
  const big = new Uint8Array(MAX_IMAGE_BYTES + 1); big.set(samples.png);
  assert.match((await validateImageFile(new Blob([big], { type: "image/png" }))).error, /5 MB/);
  const spoofed = new File([samples.svg], "foto.png", { type: "image/png" });
  assert.match((await validateImageFile(spoofed)).error, /JPEG, PNG, WebP ou AVIF/);
  const valid = await validateImageFile(new File([samples.webp], "capa.bin", { type: "application/octet-stream" }));
  assert.equal(valid.ok, true);
  assert.equal(valid.kind.mime, "image/webp");
});

test("paths are per project, unique and recognizable; public URLs are built for stored paths only", () => {
  const { projectCoverPath, isStoragePath, publicImageUrl } = images();
  const path = projectCoverPath(PROJECT_ID, { mime: "image/png", extension: "png" });
  assert.match(path, new RegExp(`^projects/${PROJECT_ID}/[0-9a-f-]{36}\\.png$`));
  assert.notEqual(path, projectCoverPath(PROJECT_ID, { mime: "image/png", extension: "png" }));
  assert.equal(isStoragePath(path), true);
  for (const value of ["https://cdn.example.com/a.png", "../../etc/passwd", `projects/${PROJECT_ID}/x.svg`, "", null]) {
    assert.equal(isStoragePath(value), false, String(value));
  }
  assert.equal(publicImageUrl(path, "https://ref.supabase.co/"), `https://ref.supabase.co/storage/v1/object/public/portfolio/${path}`);
  assert.equal(publicImageUrl("https://cdn.example.com/a.png", "https://ref.supabase.co"), "https://cdn.example.com/a.png");
  assert.equal(publicImageUrl(null, "https://ref.supabase.co"), null);
});

const loadCover = () => loadTs("src/lib/repositories/project-cover.ts", { globals: { crypto } });
const png = { kind: { mime: "image/png", extension: "png" }, bytes: samples.png };

function coverDb({ current = OLD_PATH, found = true, upload = null, update = "ok" } = {}) {
  return fakeDb((key) => {
    if (key.startsWith("projects select(cover_image)")) return { data: found ? { cover_image: current } : null, error: null };
    if (key === "storage upload") return { data: upload ? null : {}, error: upload };
    if (key.startsWith("projects update")) {
      if (update === "error") return { data: null, error: { message: "db down" } };
      return { data: update === "missing" ? [] : [{ id: PROJECT_ID }], error: null };
    }
    if (key === "storage list") return { data: [{ name: "a.png" }, { name: "b.webp" }], error: null };
    return { data: null, error: null };
  });
}

test("replace cover: upload immutable object, point project to it, then delete the previous one", async () => {
  const db = coverDb();
  assert.deepEqual(plain(await loadCover().replaceProjectCover(db, PROJECT_ID, png)), { ok: true });
  const [upload, remove] = db.storageCalls;
  assert.equal(upload[0], "upload");
  assert.equal(upload[1], "portfolio");
  assert.match(upload[2], new RegExp(`^projects/${PROJECT_ID}/[0-9a-f-]{36}\\.png$`));
  assert.deepEqual(plain(upload[4]), { contentType: "image/png", cacheControl: "31536000", upsert: false });
  assert.ok(db.log.some((key) => key.startsWith(`projects update({"cover_image":"${upload[2]}"}) id=${PROJECT_ID}`)));
  assert.deepEqual(plain(remove), ["remove", "portfolio", [OLD_PATH]]);
});

test("replace cover: database failure removes the new object (no orphan, old cover kept)", async (t) => {
  t.mock.method(console, "error", () => {});
  const db = coverDb({ update: "error" });
  assert.deepEqual(plain(await loadCover().replaceProjectCover(db, PROJECT_ID, png)), { ok: false, reason: "failed" });
  const uploaded = db.storageCalls[0][2];
  assert.deepEqual(plain(db.storageCalls[1]), ["remove", "portfolio", [uploaded]]);
  assert.equal(db.storageCalls.length, 2);
});

test("replace cover: upload failure touches nothing; missing project stops early", async (t) => {
  t.mock.method(console, "error", () => {});
  const failed = coverDb({ upload: { message: "mime not allowed" } });
  assert.equal((await loadCover().replaceProjectCover(failed, PROJECT_ID, png)).reason, "failed");
  assert.equal(failed.log.filter((key) => key.includes("update")).length, 0);

  const missing = coverDb({ found: false });
  assert.equal((await loadCover().replaceProjectCover(missing, PROJECT_ID, png)).reason, "not_found");
  assert.equal(missing.storageCalls.length, 0);
});

test("external cover URLs are never deleted from storage", async () => {
  const db = coverDb({ current: "https://cdn.example.com/legacy.png" });
  await loadCover().replaceProjectCover(db, PROJECT_ID, png);
  assert.equal(db.storageCalls.filter(([op]) => op === "remove").length, 0);
});

test("remove cover clears the column then deletes the object; folder cleanup removes all", async () => {
  const db = coverDb();
  assert.deepEqual(plain(await loadCover().removeProjectCover(db, PROJECT_ID)), { ok: true });
  assert.ok(db.log.some((key) => key.startsWith('projects update({"cover_image":null})')));
  assert.deepEqual(plain(db.storageCalls), [["remove", "portfolio", [OLD_PATH]]]);

  const folder = coverDb();
  await loadCover().removeProjectFolder(folder, PROJECT_ID);
  assert.deepEqual(plain(folder.storageCalls[0].slice(0, 3)), ["list", "portfolio", `projects/${PROJECT_ID}`]);
  // a.png / b.webp are not uuid-named, so the guard refuses to delete unknown objects
  assert.equal(folder.storageCalls.length, 1);
});

class Redirect extends Error {
  constructor(url) { super(`redirect:${url}`); this.url = url; }
}

function loadActions({ admin = true, db = coverDb() } = {}) {
  const revalidated = [];
  const actions = loadTs("src/app/admin/(painel)/projetos/actions.ts", {
    globals: { Blob, crypto },
    mocks: {
      "next/navigation": { redirect: (url) => { throw new Redirect(url); } },
      "next/cache": { revalidatePath: (path) => revalidated.push(path) },
      "@/lib/auth/admin": { requireAdmin: async () => { if (!admin) throw new Redirect("/admin/login"); } },
      "@/lib/supabase/server": { createClient: async () => db }
    }
  });
  return { actions, db, revalidated };
}
const idle = { status: "idle", message: null };
const form = (fields) => { const f = new FormData(); for (const [k, v] of Object.entries(fields)) f.append(k, v); return f; };

test("cover action: admin only; invalid id and invalid files never reach storage", async () => {
  const blocked = loadActions({ admin: false });
  await assert.rejects(blocked.actions.updateProjectCoverAction(PROJECT_ID, idle, form({ cover: new File([samples.png], "a.png") })),
    (error) => error.url === "/admin/login");
  assert.equal(blocked.db.storageCalls.length, 0);

  const { actions, db } = loadActions();
  assert.equal((await actions.updateProjectCoverAction("../x", idle, form({}))).status, "error");
  const spoofed = await actions.updateProjectCoverAction(PROJECT_ID, idle, form({ cover: new File([samples.svg], "x.png", { type: "image/png" }) }));
  assert.match(spoofed.message, /JPEG, PNG, WebP ou AVIF/);
  assert.equal(db.storageCalls.length, 0);
});

test("cover action: upload and remove update storage and revalidate the site", async () => {
  const upload = loadActions();
  const saved = await upload.actions.updateProjectCoverAction(PROJECT_ID, idle, form({ intent: "upload", cover: new File([samples.jpeg], "c.jpg") }));
  assert.deepEqual(plain(saved), { status: "saved", message: "Capa atualizada." });
  assert.match(upload.db.storageCalls[0][2], /\.jpg$/);
  assert.deepEqual(upload.revalidated, ["/"]);

  const removal = loadActions();
  const removed = await removal.actions.updateProjectCoverAction(PROJECT_ID, idle, form({ intent: "remove" }));
  assert.deepEqual(plain(removed), { status: "saved", message: "Capa removida." });
  assert.deepEqual(removal.revalidated, ["/"]);
});
