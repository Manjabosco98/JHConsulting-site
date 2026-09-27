import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

// Icon components are irrelevant here: the proxy returns the name itself, so the
// allowlist keys and the resolution logic are what the tests exercise.
const lucide = { mocks: { "lucide-react": new Proxy({}, { get: (_target, name) => name }) } };
const SERVICE_ID = "55555555-5555-4555-8555-555555555555";

const icons = () => loadTs("src/lib/services/icons.ts", lucide);

test("icon allowlist covers the seeded icons and resolves unknown names safely", () => {
  const { serviceIconNames, isServiceIconName, resolveServiceIcon, DEFAULT_SERVICE_ICON } = icons();
  for (const name of ["Bot", "Layers3", "Network", "ChartNoAxesCombined", "Database", "Sparkles", "ServerCog", "FileCog"]) {
    assert.equal(isServiceIconName(name), true, name);
    assert.equal(resolveServiceIcon(name), name);
  }
  assert.ok(serviceIconNames.length >= 8);
  for (const value of ["", "toString", "../../etc", "Trash2Evil", "constructor"]) {
    assert.equal(isServiceIconName(value), false, value);
    assert.equal(resolveServiceIcon(value), DEFAULT_SERVICE_ICON, value);
  }
});

const form = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    for (const item of [].concat(value)) data.append(key, item);
  }
  return data;
};
const validFields = {
  title: "Automação de Processos",
  slug: "",
  description: "Automatize rotinas operacionais com rastreabilidade.",
  icon: "Bot",
  tech: "Python • Playwright • APIs",
  display_order: "3",
  active: "on"
};
const validation = () => loadTs("src/lib/validation/service.ts", lucide);

test("service form: valid input is normalized (slug from title, order, active)", () => {
  const result = validation().parseServiceForm(form(validFields));
  assert.equal(result.success, true);
  assert.deepEqual(plain(result.data), {
    title: "Automação de Processos",
    slug: "automacao-de-processos",
    description: "Automatize rotinas operacionais com rastreabilidade.",
    icon: "Bot",
    tech: "Python • Playwright • APIs",
    display_order: 3,
    active: true
  });
  const unchecked = validation().parseServiceForm(form({ ...validFields, active: [], slug: "Meu-Servico" }));
  assert.equal(unchecked.data.active, false);
  assert.equal(unchecked.data.slug, "meu-servico");
});

test("service form: invalid fields get Portuguese messages; icon must be allowlisted", () => {
  const { parseServiceForm } = validation();
  const result = parseServiceForm(form({ ...validFields, title: "  ", description: "", icon: "EvilIcon", display_order: "-2" }));
  assert.equal(result.success, false);
  const errors = plain(result.fieldErrors);
  assert.equal(errors.title, "Informe o título.");
  assert.equal(errors.description, "Informe a descrição.");
  assert.equal(errors.icon, "Escolha um ícone da lista.");
  assert.equal(errors.display_order, "Use 0 ou maior.");
  assert.match(parseServiceForm(form({ ...validFields, slug: "com espaço" })).fieldErrors.slug, /minúsculas/);
  assert.match(parseServiceForm(form({ ...validFields, title: "x".repeat(161) })).fieldErrors.title, /160/);
});

const loadRepo = () => loadTs("src/lib/repositories/services.ts", lucide);
const input = { title: "T", slug: "t", description: "d", icon: "Bot", tech: "", display_order: 0, active: true };

test("repository: insert when creating, update+eq when editing", async () => {
  const created = fakeDb(() => ({ data: [{ id: SERVICE_ID }], error: null }));
  assert.deepEqual(plain(await loadRepo().saveService(created, null, input)), { ok: true, id: SERVICE_ID });
  assert.match(created.log[0], /^services insert\(.*"slug":"t".*\) select\(id\)$/);

  const updated = fakeDb(() => ({ data: [{ id: SERVICE_ID }], error: null }));
  await loadRepo().saveService(updated, SERVICE_ID, input);
  assert.match(updated.log[0], new RegExp(`^services update\\(.*\\) id=${SERVICE_ID} select\\(id\\)$`));
});

test("repository: maps duplicate slug, missing row and permission errors", async (t) => {
  const logged = t.mock.method(console, "error", () => {});
  const { saveService } = loadRepo();
  const dup = fakeDb(() => ({ data: null, error: { code: "23505", message: "dup" } }));
  assert.equal((await saveService(dup, null, input)).reason, "slug_taken");
  const denied = fakeDb(() => ({ data: null, error: { code: "42501", message: "rls" } }));
  assert.equal((await saveService(denied, SERVICE_ID, input)).reason, "forbidden");
  const missing = fakeDb(() => ({ data: [], error: null }));
  assert.equal((await saveService(missing, SERVICE_ID, input)).reason, "not_found");
  const unknown = fakeDb(() => ({ data: null, error: { code: "XX000", message: "internal detail" } }));
  assert.equal((await saveService(unknown, null, input)).reason, "unknown");
  assert.match(logged.mock.calls.at(-1).arguments[0], /internal detail/);
});

test("repository: delete reports whether a row was removed", async () => {
  const removed = fakeDb(() => ({ data: [{ id: SERVICE_ID }], error: null }));
  assert.deepEqual(plain(await loadRepo().deleteService(removed, SERVICE_ID)), { ok: true });
  assert.equal(removed.log[0], `services delete id=${SERVICE_ID} select(id)`);
  const none = fakeDb(() => ({ data: [], error: null }));
  assert.equal((await loadRepo().deleteService(none, SERVICE_ID)).ok, false);
});

class Redirect extends Error {
  constructor(url) { super(`redirect:${url}`); this.url = url; }
}

function loadActions({ admin = true, respond = () => ({ data: [{ id: SERVICE_ID }], error: null }) } = {}) {
  const db = fakeDb(respond);
  const revalidated = [];
  const actions = loadTs("src/app/admin/(painel)/servicos/actions.ts", {
    mocks: {
      ...lucide.mocks,
      "next/navigation": { redirect: (url) => { throw new Redirect(url); } },
      "next/cache": { revalidatePath: (path) => revalidated.push(path) },
      "@/lib/auth/admin": { requireAdmin: async () => { if (!admin) throw new Redirect("/admin/login"); } },
      "@/lib/supabase/server": { createClient: async () => db }
    }
  });
  return { actions, db, revalidated };
}
const idle = { status: "idle", message: null, fieldErrors: {} };

test("save action: non-admin is redirected before touching the database", async () => {
  const { actions, db } = loadActions({ admin: false });
  await assert.rejects(actions.saveServiceAction(null, idle, form(validFields)), (error) => error.url === "/admin/login");
  await assert.rejects(actions.deleteServiceAction(form({ id: SERVICE_ID })), (error) => error.url === "/admin/login");
  assert.equal(db.log.length, 0);
});

test("save action: invalid form and tampered id never reach the database", async () => {
  const { actions, db } = loadActions();
  const invalid = plain(await actions.saveServiceAction(null, idle, form({ ...validFields, icon: "Nope" })));
  assert.equal(invalid.fieldErrors.icon, "Escolha um ícone da lista.");
  const tampered = plain(await actions.saveServiceAction("not-a-uuid", idle, form(validFields)));
  assert.equal(tampered.status, "error");
  assert.equal(db.log.length, 0);
});

test("save action: create redirects to the edit page and revalidates the home", async () => {
  const { actions, revalidated } = loadActions();
  await assert.rejects(actions.saveServiceAction(null, idle, form(validFields)), (error) => error.url === `/admin/servicos/${SERVICE_ID}?criado=1`);
  assert.deepEqual(revalidated, ["/"]);
});

test("save action: update succeeds; duplicate slug becomes a field error without revalidating", async () => {
  const saved = plain(await loadActions().actions.saveServiceAction(SERVICE_ID, idle, form(validFields)));
  assert.deepEqual(saved, { status: "saved", message: "Serviço salvo.", fieldErrors: {} });

  const { actions, revalidated } = loadActions({ respond: () => ({ data: null, error: { code: "23505", message: "dup" } }) });
  const duplicate = plain(await actions.saveServiceAction(SERVICE_ID, idle, form(validFields)));
  assert.equal(duplicate.fieldErrors.slug, "Já existe um serviço com este slug.");
  assert.equal(revalidated.length, 0);
});

test("delete action: removes by id, revalidates and reports failures", async () => {
  const ok = loadActions();
  await assert.rejects(ok.actions.deleteServiceAction(form({ id: SERVICE_ID })), (error) => error.url === "/admin/servicos?excluido=1");
  assert.deepEqual(ok.revalidated, ["/"]);

  const missing = loadActions({ respond: () => ({ data: [], error: null }) });
  await assert.rejects(missing.actions.deleteServiceAction(form({ id: SERVICE_ID })), (error) => error.url === `/admin/servicos/${SERVICE_ID}?erro=exclusao`);
  assert.equal(missing.revalidated.length, 0);

  const invalid = loadActions();
  await assert.rejects(invalid.actions.deleteServiceAction(form({ id: "1 or 1=1" })), (error) => error.url === "/admin/servicos");
  assert.equal(invalid.db.log.length, 0);
});
