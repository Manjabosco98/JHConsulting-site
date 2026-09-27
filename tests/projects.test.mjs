import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

class Redirect extends Error {
  constructor(url) { super(`redirect:${url}`); this.url = url; }
}
const navigation = { redirect: (url) => { throw new Redirect(url); }, notFound: () => { throw new Error("notFound"); } };

const TECH_A = "11111111-1111-4111-8111-111111111111";
const TECH_B = "22222222-2222-4222-8222-222222222222";
const PROJECT_ID = "33333333-3333-4333-8333-333333333333";

const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of [].concat(value)) data.append(key, item);
  }
  return data;
};
const validFields = {
  title: "Automação Fiscal / NFS-e",
  slug: "",
  category: "Automação empresarial",
  status: "Case técnico",
  short_description: "",
  description: "",
  problem: "Rotinas manuais.",
  solution: "Automação.",
  repository_url: "",
  demo_url: "https://demo.example.com/app",
  display_order: "2",
  visibility: "published",
  featured: "on",
  technology_ids: [TECH_B, TECH_A]
};

test("slugify: accents, symbols, spacing and length", () => {
  const { slugify, SLUG_PATTERN } = loadTs("src/lib/slug.ts");
  assert.equal(slugify("Automação Fiscal / NFS-e"), "automacao-fiscal-nfs-e");
  assert.equal(slugify("  Dashboards   & Integrações!! "), "dashboards-integracoes");
  assert.equal(slugify("!!!"), "");
  assert.equal(slugify("a".repeat(100) + " " + "b".repeat(100), 150).length <= 150, true);
  assert.equal(slugify("abc def", 4), "abc");
  assert.ok(SLUG_PATTERN.test(slugify("SGECHAT 2.0 — Plataforma")));
});

test("project form: valid input is normalized (slug from title, booleans, order, techs in order)", () => {
  const { parseProjectForm } = loadTs("src/lib/validation/project.ts");
  const result = parseProjectForm(form(validFields));
  assert.equal(result.success, true);
  assert.deepEqual(plain(result.data), {
    title: "Automação Fiscal / NFS-e", slug: "automacao-fiscal-nfs-e", category: "Automação empresarial",
    status: "Case técnico", short_description: "", description: "", problem: "Rotinas manuais.", solution: "Automação.",
    repository_url: "", demo_url: "https://demo.example.com/app", featured: true, display_order: 2,
    visibility: "published", technology_ids: [TECH_B, TECH_A]
  });
  const unchecked = parseProjectForm(form({ ...validFields, featured: [], slug: "Meu-Slug" }));
  assert.equal(unchecked.data.featured, false);
  assert.equal(unchecked.data.slug, "meu-slug");
});

test("project form: every invalid field gets a Portuguese message", () => {
  const { parseProjectForm } = loadTs("src/lib/validation/project.ts");
  const result = parseProjectForm(form({
    ...validFields,
    title: " ",
    category: "",
    repository_url: "javascript:alert(1)",
    demo_url: "ftp://x.com",
    display_order: "-1",
    visibility: "public",
    technology_ids: [TECH_A, TECH_A]
  }));
  assert.equal(result.success, false);
  const errors = plain(result.fieldErrors);
  assert.equal(errors.title, "Informe o título.");
  assert.equal(errors.category, "Informe a categoria.");
  assert.match(errors.repository_url, /http:\/\/ ou https:\/\//);
  assert.match(errors.demo_url, /http:\/\/ ou https:\/\//);
  assert.equal(errors.display_order, "Use 0 ou maior.");
  assert.equal(errors.visibility, "Escolha a situação do projeto.");
  assert.equal(errors.technology_ids, "Tecnologia repetida.");
});

test("project form: slug with invalid characters or a title without letters is rejected", () => {
  const { parseProjectForm } = loadTs("src/lib/validation/project.ts");
  assert.match(parseProjectForm(form({ ...validFields, slug: "meu slug!" })).fieldErrors.slug, /minúsculas/);
  assert.match(parseProjectForm(form({ ...validFields, title: "!!!" })).fieldErrors.slug, /minúsculas/);
  assert.match(parseProjectForm(form({ ...validFields, title: "x".repeat(161) })).fieldErrors.title, /160/);
});

const loadRepo = () => loadTs("src/lib/repositories/projects.ts");

test("repository: filters, literal search and visibility mapping", async () => {
  const rows = [
    { id: "1", title: "A", slug: "a", category: "c", status: "", published: true, archived_at: null, featured: true, display_order: 1, updated_at: "2026-09-27T00:00:00Z", project_technologies: [{ count: 4 }] },
    { id: "2", title: "B", slug: "b", category: "c", status: "", published: false, archived_at: "2026-09-27T00:00:00Z", featured: false, display_order: 2, updated_at: "2026-09-27T00:00:00Z", project_technologies: [] }
  ];
  const db = fakeDb(() => ({ data: rows, error: null }));
  const list = plain(await loadRepo().listAdminProjects(db, { filter: "rascunhos", search: "50%_off" }));
  assert.deepEqual(list.map((p) => [p.visibility, p.technologies]), [["published", 4], ["archived", 0]]);
  assert.match(db.log[0], /published=false archived_at is null title ilike %50\\%\\_off%$/);

  await loadRepo().listAdminProjects(db, { filter: "arquivados", search: "" });
  assert.match(db.log[1], /archived_at not is null$/);
  await loadRepo().listAdminProjects(db, { filter: "publicados", search: "" });
  assert.match(db.log[2], /published=true$/);
});

test("repository: save sends p_id only for updates and maps database errors", async () => {
  const { saveProject } = loadRepo();
  const input = { title: "T", slug: "t", technology_ids: [TECH_A], visibility: "draft" };

  const created = fakeDb(() => ({ data: PROJECT_ID, error: null }));
  assert.deepEqual(plain(await saveProject(created, null, input)), { ok: true, id: PROJECT_ID });
  assert.deepEqual(plain(created.rpcCalls[0]), ["admin_save_project", {
    p_project: { title: "T", slug: "t", visibility: "draft" }, p_technology_ids: [TECH_A]
  }]);

  const updated = fakeDb(() => ({ data: PROJECT_ID, error: null }));
  await saveProject(updated, PROJECT_ID, input);
  assert.equal(updated.rpcCalls[0][1].p_id, PROJECT_ID);

  for (const [code, reason] of [["23505", "slug_taken"], ["P0002", "not_found"], ["23503", "invalid_technology"], ["42501", "forbidden"]]) {
    const db = fakeDb(() => ({ data: null, error: { code, message: "x" } }));
    assert.equal((await saveProject(db, null, input)).reason, reason);
  }
});

test("repository: unexpected save errors are logged, not exposed", async (t) => {
  const logged = t.mock.method(console, "error", () => {});
  const db = fakeDb(() => ({ data: null, error: { code: "XX000", message: "internal detail" } }));
  assert.deepEqual(plain(await loadRepo().saveProject(db, null, { technology_ids: [] })), { ok: false, reason: "unknown" });
  assert.match(logged.mock.calls[0].arguments[0], /internal detail/);
});

function loadActions({ admin = true, respond = () => ({ data: PROJECT_ID, error: null }) } = {}) {
  const db = fakeDb(respond);
  const revalidated = [];
  const actions = loadTs("src/app/admin/(painel)/projetos/actions.ts", {
    mocks: {
      "next/navigation": navigation,
      "next/cache": { revalidatePath: (path) => revalidated.push(path) },
      "@/lib/auth/admin": { requireAdmin: async () => { if (!admin) throw new Redirect("/admin/login"); return { userId: "u" }; } },
      "@/lib/supabase/server": { createClient: async () => db }
    }
  });
  return { actions, db, revalidated };
}
const idle = { status: "idle", message: null, fieldErrors: {} };
// revalidatePublicProjects() purges every public project surface.
const publicPaths = ["/", "/projetos", "/projetos/[slug]", "/sitemap.xml"];

test("save action: non-admin is redirected before touching the database", async () => {
  const { actions, db } = loadActions({ admin: false });
  await assert.rejects(actions.saveProjectAction(null, idle, form(validFields)), (error) => error.url === "/admin/login");
  await assert.rejects(actions.deleteProjectAction(form({ id: PROJECT_ID })), (error) => error.url === "/admin/login");
  assert.equal(db.rpcCalls.length + db.log.length, 0);
});

test("save action: invalid form returns field errors without calling the database", async () => {
  const { actions, db } = loadActions();
  const state = plain(await actions.saveProjectAction(null, idle, form({ ...validFields, title: "" })));
  assert.equal(state.status, "error");
  assert.equal(state.fieldErrors.title, "Informe o título.");
  assert.equal(db.rpcCalls.length, 0);
});

test("save action: create redirects to the edit page and revalidates the public site", async () => {
  const { actions, db, revalidated } = loadActions();
  await assert.rejects(actions.saveProjectAction(null, idle, form(validFields)), (error) => error.url === `/admin/projetos/${PROJECT_ID}?criado=1`);
  assert.equal(db.rpcCalls[0][1].p_project.slug, "automacao-fiscal-nfs-e");
  assert.deepEqual(plain(db.rpcCalls[0][1].p_technology_ids), [TECH_B, TECH_A]);
  assert.deepEqual(revalidated, publicPaths);
});

test("save action: update returns success; duplicate slug becomes a field error", async () => {
  const saved = plain(await loadActions().actions.saveProjectAction(PROJECT_ID, idle, form(validFields)));
  assert.deepEqual(saved, { status: "saved", message: "Projeto salvo.", fieldErrors: {} });

  const { actions, revalidated } = loadActions({ respond: () => ({ data: null, error: { code: "23505", message: "dup" } }) });
  const duplicate = plain(await actions.saveProjectAction(PROJECT_ID, idle, form(validFields)));
  assert.equal(duplicate.fieldErrors.slug, "Já existe um projeto com este slug.");
  assert.equal(revalidated.length, 0);

  const tampered = plain(await loadActions().actions.saveProjectAction("not-a-uuid", idle, form(validFields)));
  assert.equal(tampered.status, "error");
});

test("delete action: deletes by id, revalidates and reports missing rows", async () => {
  const ok = loadActions({ respond: () => ({ data: [{ id: PROJECT_ID }], error: null }) });
  await assert.rejects(ok.actions.deleteProjectAction(form({ id: PROJECT_ID })), (error) => error.url === "/admin/projetos?excluido=1");
  assert.equal(ok.db.log[0], `projects delete id=${PROJECT_ID} select(id)`);
  assert.deepEqual(ok.revalidated, publicPaths);

  const missing = loadActions({ respond: () => ({ data: [], error: null }) });
  await assert.rejects(missing.actions.deleteProjectAction(form({ id: PROJECT_ID })), (error) => error.url === `/admin/projetos/${PROJECT_ID}?erro=exclusao`);
  assert.equal(missing.revalidated.length, 0);

  const invalid = loadActions();
  await assert.rejects(invalid.actions.deleteProjectAction(form({ id: "1 or 1=1" })), (error) => error.url === "/admin/projetos");
  assert.equal(invalid.db.log.length, 0);
});
