import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

const TECH_A = "11111111-1111-4111-8111-111111111111";
const TECH_B = "22222222-2222-4222-8222-222222222222";
const GROUP_ID = "66666666-6666-4666-8666-666666666666";

const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of [].concat(value)) data.append(key, item);
  }
  return data;
};
const validation = () => loadTs("src/lib/validation/technology.ts");

test("technology form: slug from name, order coercion and active checkbox", () => {
  const { parseTechnologyForm } = validation();
  const result = parseTechnologyForm(form({ name: "Power Query", slug: "", display_order: "5", active: "on" }));
  assert.deepEqual(plain(result.data), { name: "Power Query", slug: "power-query", display_order: 5, active: true });
  const off = parseTechnologyForm(form({ name: "SQL Server", slug: "SQL-Server", display_order: "", active: [] }));
  assert.deepEqual(plain(off.data), { name: "SQL Server", slug: "sql-server", display_order: 0, active: false });
});

test("technology form: invalid fields report Portuguese messages", () => {
  const { parseTechnologyForm } = validation();
  const empty = parseTechnologyForm(form({ name: "  ", slug: "", display_order: "0" }));
  assert.equal(empty.fieldErrors.name, "Informe o nome.");
  assert.match(parseTechnologyForm(form({ name: "Ok", slug: "com espaço", display_order: "0" })).fieldErrors.slug, /minúsculas/);
  assert.match(parseTechnologyForm(form({ name: "!!!", slug: "", display_order: "0" })).fieldErrors.slug, /minúsculas/);
  assert.equal(parseTechnologyForm(form({ name: "Ok", slug: "", display_order: "-1" })).fieldErrors.display_order, "Use 0 ou maior.");
  assert.match(parseTechnologyForm(form({ name: "x".repeat(101), slug: "", display_order: "0" })).fieldErrors.name, /100/);
});

test("group form: members keep the submitted order; duplicates are rejected", () => {
  const { parseTechnologyGroupForm } = validation();
  const result = parseTechnologyGroupForm(form({
    name: "Bancos de Dados", slug: "", display_order: "2", active: "on", technology_ids: [TECH_B, TECH_A]
  }));
  assert.deepEqual(plain(result.data), {
    name: "Bancos de Dados", slug: "bancos-de-dados", display_order: 2, active: true, technology_ids: [TECH_B, TECH_A]
  });
  const empty = parseTechnologyGroupForm(form({ name: "Vazio", slug: "", display_order: "0", active: "on" }));
  assert.deepEqual(plain(empty.data.technology_ids), []);
  const duplicated = parseTechnologyGroupForm(form({ name: "G", slug: "", display_order: "0", active: "on", technology_ids: [TECH_A, TECH_A] }));
  assert.equal(duplicated.fieldErrors.technology_ids, "Tecnologia repetida.");
  const bad = parseTechnologyGroupForm(form({ name: "G", slug: "", display_order: "0", active: "on", technology_ids: ["nope"] }));
  assert.equal(bad.fieldErrors.technology_ids, "Tecnologia inválida.");
});

const loadRepo = () => loadTs("src/lib/repositories/technologies.ts");

test("repository: technology list exposes group and project usage counts", async () => {
  const db = fakeDb(() => ({
    data: [
      { id: TECH_A, name: "Python", slug: "python", active: true, display_order: 1, project_technologies: [{ count: 2 }], technology_group_members: [{ count: 2 }] },
      { id: TECH_B, name: "XML", slug: "xml", active: false, display_order: 32, project_technologies: [], technology_group_members: [] }
    ],
    error: null
  }));
  const list = plain(await loadRepo().listAdminTechnologies(db));
  assert.deepEqual(list.map((t) => [t.name, t.projects, t.groups]), [["Python", 2, 2], ["XML", 0, 0]]);
});

test("repository: group save sends p_id only when editing and keeps member order", async () => {
  const { saveTechnologyGroup } = loadRepo();
  const input = { name: "G", slug: "g", active: true, display_order: 1, technology_ids: [TECH_B, TECH_A] };

  const created = fakeDb(() => ({ data: GROUP_ID, error: null }));
  assert.deepEqual(plain(await saveTechnologyGroup(created, null, input)), { ok: true, id: GROUP_ID });
  assert.deepEqual(plain(created.rpcCalls[0]), ["admin_save_technology_group", {
    p_group: { name: "G", slug: "g", active: true, display_order: 1 },
    p_technology_ids: [TECH_B, TECH_A]
  }]);

  const updated = fakeDb(() => ({ data: GROUP_ID, error: null }));
  await saveTechnologyGroup(updated, GROUP_ID, input);
  assert.equal(updated.rpcCalls[0][1].p_id, GROUP_ID);

  for (const [code, reason] of [["23505", "slug_taken"], ["P0002", "not_found"], ["23503", "invalid_technology"], ["42501", "forbidden"]]) {
    const db = fakeDb(() => ({ data: null, error: { code, message: "x" } }));
    assert.equal((await saveTechnologyGroup(db, null, input)).reason, reason);
  }
});

test("repository: technology delete maps the project-link block to in_use", async () => {
  const { deleteTechnology } = loadRepo();
  const ok = fakeDb(() => ({ data: null, error: null }));
  assert.deepEqual(plain(await deleteTechnology(ok, TECH_A)), { ok: true });
  assert.deepEqual(plain(ok.rpcCalls[0]), ["admin_delete_technology", { p_id: TECH_A }]);
  for (const [code, reason] of [["23503", "in_use"], ["P0002", "not_found"], ["42501", "forbidden"]]) {
    const db = fakeDb(() => ({ data: null, error: { code, message: "x" } }));
    assert.equal((await deleteTechnology(db, TECH_A)).reason, reason);
  }
});

class Redirect extends Error {
  constructor(url) { super(`redirect:${url}`); this.url = url; }
}

function loadActions({ admin = true, respond = () => ({ data: GROUP_ID, error: null }) } = {}) {
  const db = fakeDb(respond);
  const revalidated = [];
  const actions = loadTs("src/app/admin/(painel)/tecnologias/actions.ts", {
    mocks: {
      "next/navigation": { redirect: (url) => { throw new Redirect(url); } },
      "next/cache": { revalidatePath: (path) => revalidated.push(path) },
      "@/lib/auth/admin": { requireAdmin: async () => { if (!admin) throw new Redirect("/admin/login"); } },
      "@/lib/supabase/server": { createClient: async () => db }
    }
  });
  return { actions, db, revalidated };
}
const idle = { status: "idle", message: null, fieldErrors: {} };
// Technologies appear on the home section and on every project surface.
const publicPaths = ["/", "/projetos", "/projetos/[slug]", "/sitemap.xml"];
const groupFields = { name: "Backend", slug: "", display_order: "1", active: "on", technology_ids: [TECH_A] };

test("actions: non-admin is redirected before touching the database", async () => {
  const { actions, db } = loadActions({ admin: false });
  for (const call of [
    () => actions.saveTechnologyAction(null, idle, form({ name: "X", slug: "", display_order: "0" })),
    () => actions.saveTechnologyGroupAction(null, idle, form(groupFields)),
    () => actions.deleteTechnologyAction(form({ id: TECH_A })),
    () => actions.deleteTechnologyGroupAction(form({ id: GROUP_ID }))
  ]) {
    await assert.rejects(call, (error) => error.url === "/admin/login");
  }
  assert.equal(db.log.length + db.rpcCalls.length, 0);
});

test("actions: group create redirects to the edit page and revalidates project surfaces", async () => {
  const { actions, revalidated } = loadActions();
  await assert.rejects(
    actions.saveTechnologyGroupAction(null, idle, form(groupFields)),
    (error) => error.url === `/admin/tecnologias/grupos/${GROUP_ID}?criado=1`
  );
  assert.deepEqual(revalidated, publicPaths);
});

test("actions: technology create/update and duplicate slug", async () => {
  const created = loadActions({ respond: () => ({ data: [{ id: TECH_A }], error: null }) });
  await assert.rejects(
    created.actions.saveTechnologyAction(null, idle, form({ name: "Deno", slug: "", display_order: "0", active: "on" })),
    (error) => error.url === `/admin/tecnologias/${TECH_A}?criado=1`
  );
  assert.deepEqual(created.revalidated, publicPaths);

  const saved = plain(await loadActions({ respond: () => ({ data: [{ id: TECH_A }], error: null }) })
    .actions.saveTechnologyAction(TECH_A, idle, form({ name: "Deno", slug: "", display_order: "0", active: "on" })));
  assert.deepEqual(saved, { status: "saved", message: "Tecnologia salva.", fieldErrors: {} });

  const dup = loadActions({ respond: () => ({ data: null, error: { code: "23505", message: "dup" } }) });
  const state = plain(await dup.actions.saveTechnologyAction(null, idle, form({ name: "Python", slug: "", display_order: "0", active: "on" })));
  assert.equal(state.fieldErrors.slug, "Já existe uma tecnologia com este slug.");
  assert.equal(dup.revalidated.length, 0);
});

test("actions: blocked technology delete keeps the reason in the URL", async () => {
  const blocked = loadActions({ respond: () => ({ data: null, error: { code: "23503", message: "linked" } }) });
  await assert.rejects(
    blocked.actions.deleteTechnologyAction(form({ id: TECH_A })),
    (error) => error.url === `/admin/tecnologias/${TECH_A}?erro=in_use`
  );
  assert.equal(blocked.revalidated.length, 0);

  const ok = loadActions({ respond: () => ({ data: null, error: null }) });
  await assert.rejects(ok.actions.deleteTechnologyAction(form({ id: TECH_A })), (error) => error.url === "/admin/tecnologias?excluido=1");
  assert.deepEqual(ok.revalidated, publicPaths);

  const invalid = loadActions();
  await assert.rejects(invalid.actions.deleteTechnologyAction(form({ id: "1; drop table" })), (error) => error.url === "/admin/tecnologias");
  assert.equal(invalid.db.rpcCalls.length, 0);
});

test("actions: group delete returns to the technologies page", async () => {
  const ok = loadActions({ respond: () => ({ data: [{ id: GROUP_ID }], error: null }) });
  await assert.rejects(ok.actions.deleteTechnologyGroupAction(form({ id: GROUP_ID })), (error) => error.url === "/admin/tecnologias?grupo_excluido=1");
  assert.equal(ok.db.log[0], `technology_groups delete id=${GROUP_ID} select(id)`);

  const missing = loadActions({ respond: () => ({ data: [], error: null }) });
  await assert.rejects(
    missing.actions.deleteTechnologyGroupAction(form({ id: GROUP_ID })),
    (error) => error.url === `/admin/tecnologias/grupos/${GROUP_ID}?erro=exclusao`
  );
  assert.equal(missing.revalidated.length, 0);
});
