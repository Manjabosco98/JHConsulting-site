import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

const PHOTO = "settings/44444444-4444-4444-8444-444444444444.png";
const png = { kind: { mime: "image/png", extension: "png" }, bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) };

const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
};
const validFields = {
  company_name: "JHConsulting",
  professional_name: "João Henrique Manjabosco",
  role: "Analista de Sistemas",
  description: "Tecnologia aplicada a negócios.",
  bio: "Primeiro parágrafo.\n\nSegundo parágrafo.",
  email: "contato@exemplo.com.br",
  phone: "",
  whatsapp: "55 62 90000-0000",
  linkedin_url: "https://www.linkedin.com/in/exemplo",
  github_url: "",
  instagram_url: "",
  location: "Goiânia, Goiás, Brasil",
  service_area: "Atendimento remoto em todo o Brasil"
};
const validation = () => loadTs("src/lib/validation/settings.ts");

test("settings form: trims values and stores empty optional fields as null", () => {
  const result = validation().parseSettingsForm(form({ ...validFields, company_name: "  JHConsulting  " }));
  assert.equal(result.success, true);
  assert.equal(result.data.company_name, "JHConsulting");
  assert.equal(result.data.phone, null);
  assert.equal(result.data.github_url, null);
  assert.equal(result.data.instagram_url, null);
  assert.equal(result.data.email, "contato@exemplo.com.br");
  assert.equal(result.data.linkedin_url, "https://www.linkedin.com/in/exemplo");
});

test("settings form: required fields, e-mail, WhatsApp and URLs are validated", () => {
  const { parseSettingsForm } = validation();
  const result = parseSettingsForm({ ...form({}), get: () => "" });
  assert.equal(result.success, false);
  const missing = plain(result.fieldErrors);
  assert.equal(missing.company_name, "Informe o nome da empresa.");
  assert.equal(missing.professional_name, "Informe o nome do profissional.");
  assert.equal(missing.role, "Informe o cargo.");
  assert.equal(missing.description, "Informe a descrição.");
  assert.equal(missing.location, "Informe a localização.");
  assert.equal(missing.service_area, "Informe a área de atendimento.");

  assert.equal(parseSettingsForm(form({ ...validFields, email: "sem-arroba" })).fieldErrors.email, "Informe um e-mail válido.");
  assert.match(parseSettingsForm(form({ ...validFields, whatsapp: "123" })).fieldErrors.whatsapp, /DDD/);
  assert.match(parseSettingsForm(form({ ...validFields, linkedin_url: "linkedin.com/in/x" })).fieldErrors.linkedin_url, /LinkedIn/);
  assert.match(parseSettingsForm(form({ ...validFields, github_url: "javascript:alert(1)" })).fieldErrors.github_url, /GitHub/);
  assert.match(parseSettingsForm(form({ ...validFields, role: "x".repeat(251) })).fieldErrors.role, /250/);
});

const loadRepo = () => loadTs("src/lib/repositories/settings.ts", { globals: { crypto } });

test("repository: settings are saved as an upsert of the singleton row", async () => {
  const db = fakeDb(() => ({ data: null, error: null }));
  const input = { company_name: "JH", location: "Goiânia", email: null };
  assert.deepEqual(plain(await loadRepo().saveSettings(db, input)), { ok: true });
  assert.match(db.log[0], /^site_settings upsert\(\{"id":1,"company_name":"JH".*\},\{"onConflict":"id"\}\)$/);

  const denied = fakeDb(() => ({ data: null, error: { code: "42501", message: "rls" } }));
  assert.equal((await loadRepo().saveSettings(denied, input)).reason, "forbidden");
});

function photoDb({ current = PHOTO, upload = null, update = "ok" } = {}) {
  return fakeDb((key) => {
    if (key.startsWith("site_settings select(profile_image)")) return { data: { profile_image: current }, error: null };
    if (key === "storage upload") return { data: upload ? null : {}, error: upload };
    if (key.startsWith("site_settings update")) {
      if (update === "error") return { data: null, error: { message: "db down" } };
      return { data: update === "missing" ? [] : [{ id: 1 }], error: null };
    }
    return { data: null, error: null };
  });
}

test("photo: uploads to settings/<uuid>, points the row at it, then removes the old one", async () => {
  const db = photoDb();
  assert.deepEqual(plain(await loadRepo().replaceProfilePhoto(db, png)), { ok: true });
  const [upload, remove] = db.storageCalls;
  assert.match(upload[2], /^settings\/[0-9a-f-]{36}\.png$/);
  assert.deepEqual(plain(upload[4]), { contentType: "image/png", cacheControl: "31536000", upsert: false });
  assert.ok(db.log.some((key) => key.startsWith(`site_settings update({"profile_image":"${upload[2]}"}) id=1`)));
  assert.deepEqual(plain(remove), ["remove", "portfolio", [PHOTO]]);
});

test("photo: a failed database update removes the new object (no orphan)", async (t) => {
  t.mock.method(console, "error", () => {});
  const db = photoDb({ update: "error" });
  assert.equal((await loadRepo().replaceProfilePhoto(db, png)).ok, false);
  const uploaded = db.storageCalls[0][2];
  assert.deepEqual(plain(db.storageCalls[1]), ["remove", "portfolio", [uploaded]]);
  assert.equal(db.storageCalls.length, 2);
});

test("photo: removal clears the column and deletes the object; external URLs are kept", async () => {
  const db = photoDb();
  assert.deepEqual(plain(await loadRepo().removeProfilePhoto(db)), { ok: true });
  assert.ok(db.log.some((key) => key.startsWith('site_settings update({"profile_image":null})')));
  assert.deepEqual(plain(db.storageCalls), [["remove", "portfolio", [PHOTO]]]);

  const external = photoDb({ current: "https://cdn.example.com/foto.png" });
  await loadRepo().removeProfilePhoto(external);
  assert.equal(external.storageCalls.length, 0);
});

test("storage paths: settings photos are recognized, arbitrary names are not", () => {
  const { isStoragePath, profilePhotoPath } = loadTs("src/lib/storage/images.ts", { globals: { Blob, crypto } });
  assert.match(profilePhotoPath({ mime: "image/webp", extension: "webp" }), /^settings\/[0-9a-f-]{36}\.webp$/);
  assert.equal(isStoragePath(PHOTO), true);
  assert.equal(isStoragePath("projects/33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444.png"), true);
  for (const value of ["settings/foto.png", "settings/../secret.png", "settings/44444444-4444-4444-8444-444444444444.svg"]) {
    assert.equal(isStoragePath(value), false, value);
  }
});

class Redirect extends Error {
  constructor(url) { super(`redirect:${url}`); this.url = url; }
}

function loadActions({ admin = true, db = fakeDb(() => ({ data: null, error: null })) } = {}) {
  const revalidated = [];
  const actions = loadTs("src/app/admin/(painel)/configuracoes/actions.ts", {
    globals: { Blob, crypto },
    mocks: {
      "next/cache": { revalidatePath: (path) => revalidated.push(path) },
      "@/lib/auth/admin": { requireAdmin: async () => { if (!admin) throw new Redirect("/admin/login"); } },
      "@/lib/supabase/server": { createClient: async () => db }
    }
  });
  return { actions, db, revalidated };
}
const idle = { status: "idle", message: null, fieldErrors: {} };
const publicPaths = ["/", "/projetos", "/projetos/[slug]", "/sitemap.xml"];

test("actions: non-admin never reaches the database", async () => {
  const { actions, db } = loadActions({ admin: false });
  await assert.rejects(actions.saveSettingsAction(idle, form(validFields)), (error) => error.url === "/admin/login");
  await assert.rejects(actions.updateProfilePhotoAction({ status: "idle", message: null }, form({ intent: "remove" })), (error) => error.url === "/admin/login");
  assert.equal(db.log.length, 0);
});

test("actions: saving settings revalidates every public surface", async () => {
  const { actions, revalidated } = loadActions();
  const saved = plain(await actions.saveSettingsAction(idle, form(validFields)));
  assert.deepEqual(saved, { status: "saved", message: "Configurações salvas.", fieldErrors: {} });
  assert.deepEqual(revalidated, publicPaths);

  const invalid = loadActions();
  const state = plain(await invalid.actions.saveSettingsAction(idle, form({ ...validFields, email: "x" })));
  assert.equal(state.fieldErrors.email, "Informe um e-mail válido.");
  assert.equal(invalid.revalidated.length, 0);
  assert.equal(invalid.db.log.length, 0);
});

test("actions: photo upload validates the file content before storing", async () => {
  const spoofed = loadActions();
  const state = await spoofed.actions.updateProfilePhotoAction({ status: "idle", message: null },
    form({ intent: "upload", photo: new File(["<svg/>"], "foto.png", { type: "image/png" }) }));
  assert.match(state.message, /JPEG, PNG, WebP ou AVIF/);
  assert.equal(spoofed.db.storageCalls.length, 0);

  const ok = loadActions({ db: photoDb() });
  const uploaded = await ok.actions.updateProfilePhotoAction({ status: "idle", message: null },
    form({ intent: "upload", photo: new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d])], "f.png") }));
  assert.deepEqual(plain(uploaded), { status: "saved", message: "Foto atualizada." });
  assert.deepEqual(ok.revalidated, publicPaths);
});

const loadPublic = () => (client, mocks = {}) => loadTs("src/lib/repositories/public-settings.ts", {
  mocks: {
    react: { cache: (fn) => fn },
    "@/lib/supabase/public": { createPublicClient: () => client },
    ...mocks
  }
});

test("public settings: maps the row, splits the bio and nulls out empty fields", async () => {
  const row = {
    company_name: "JHConsulting", professional_name: "João", role: "Analista", description: "Desc",
    bio: "Um.\n\nDois.\n\nTrês.", email: "a@b.co", phone: "", whatsapp: "5562900000000",
    linkedin_url: "https://linkedin.com/in/x", github_url: "   ", instagram_url: null,
    location: "Goiânia, Goiás, Brasil", service_area: "Brasil", profile_image: PHOTO,
    updated_at: "2026-09-20T12:00:00Z"
  };
  const db = fakeDb(() => ({ data: row, error: null }));
  const settings = plain(await loadPublic()(db).getSiteSettings());
  assert.equal(settings.updatedAt, "2026-09-20T12:00:00Z", "alimenta o lastModified do sitemap");
  assert.deepEqual(settings.bio, ["Um.", "Dois.", "Três."]);
  assert.equal(settings.phone, null);
  assert.equal(settings.githubUrl, null, "campo em branco não vira link");
  assert.equal(settings.instagramUrl, null);
  assert.equal(settings.email, "a@b.co");
  assert.equal(settings.linkedinUrl, "https://linkedin.com/in/x");
  assert.match(settings.profileImageUrl, /\/storage\/v1\/object\/public\/portfolio\/settings\//);
});

// Fase 14: sem dado embutido. Uma falha degrada a seção, não substitui por cópia
// antiga — só a marca sobrevive, porque também é o wordmark da marcação.
test("public settings: missing row or query error degrade instead of using bundled copy", async (t) => {
  t.mock.method(console, "error", () => {});
  const degraded = { companyName: "JHConsulting", professionalName: "", role: "", description: "", bio: [],
    email: null, phone: null, whatsapp: null, linkedinUrl: null, githubUrl: null, instagramUrl: null,
    location: "", serviceArea: "", profileImageUrl: null, updatedAt: null };

  const missing = fakeDb(() => ({ data: null, error: null }));
  assert.deepEqual(plain(await loadPublic()(missing).getSiteSettings()), degraded);

  const broken = fakeDb(() => ({ data: null, error: { message: "boom" } }));
  assert.deepEqual(plain(await loadPublic()(broken).getSiteSettings()), degraded);
});

test("constants no longer carry content that lives in the database", () => {
  const content = loadTs("src/constants/content.ts");
  for (const gone of ["services", "projects", "technologies", "techVisual"]) {
    assert.equal(gone in content, false, `${gone} deveria ter saído das constants`);
  }
  assert.ok(content.problems.length && content.workflow.length, "o texto editorial continua no código");

  const { siteConfig } = loadTs("src/constants/site.ts", { env: { NEXT_PUBLIC_SITE_URL: "https://exemplo.com.br" } });
  assert.deepEqual(Object.keys(plain(siteConfig)).sort(), ["name", "nav", "url"]);
  assert.equal(siteConfig.url, "https://exemplo.com.br");
});

test("whatsapp link: digits only, custom message, and contact fallback", () => {
  const { whatsappLink, DEFAULT_WHATSAPP_MESSAGE } = loadTs("src/lib/whatsapp.ts");
  assert.equal(whatsappLink("55 (62) 90000-0000").startsWith("https://wa.me/5562900000000?text="), true);
  assert.equal(whatsappLink(null), "#contato");
  assert.equal(whatsappLink(""), "#contato");
  assert.equal(whatsappLink("abc"), "#contato");
  assert.ok(whatsappLink("5562900000000").includes(encodeURIComponent(DEFAULT_WHATSAPP_MESSAGE)));
  assert.ok(whatsappLink("5562900000000", "Olá & tchau").includes(encodeURIComponent("Olá & tchau")));
});
