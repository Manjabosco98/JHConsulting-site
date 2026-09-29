import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

test("admin navigation: dashboard only on /admin; sections include sub-routes", () => {
  const { isActiveNav, adminNavItems } = loadTs("src/lib/admin/navigation.ts");
  assert.equal(isActiveNav("/admin", "/admin"), true);
  assert.equal(isActiveNav("/admin/projetos", "/admin"), false);
  assert.equal(isActiveNav("/admin/projetos", "/admin/projetos"), true);
  assert.equal(isActiveNav("/admin/projetos/novo", "/admin/projetos"), true);
  assert.equal(isActiveNav("/admin/projetos-antigos", "/admin/projetos"), false);
  assert.deepEqual(plain(adminNavItems.map((item) => item.href)), [
    "/admin", "/admin/projetos", "/admin/servicos", "/admin/tecnologias", "/admin/contatos", "/admin/configuracoes"
  ]);
});

const projectRows = [
  { published: true, archived_at: null },
  { published: true, archived_at: null },
  { published: true, archived_at: null },
  { published: false, archived_at: null },
  { published: false, archived_at: "2026-01-01T00:00:00Z" }
];
const serviceRows = Array.from({ length: 8 }, (_, i) => ({ active: i < 7 }));
const technologyRows = Array.from({ length: 32 }, (_, i) => ({ active: i < 30 }));
const contactRows = Array.from({ length: 4 }, (_, i) => ({ status: i < 2 ? "NEW" : "OPEN" }));

const listed = {
  "contacts select(id, name, company, project_type, status, created_at) order created_at desc limit 5":
    [{ id: "c1", name: "Ana", company: "", project_type: "Site", status: "NEW", created_at: "2026-09-27T12:00:00Z" }],
  "projects select(id, title, published, archived_at, updated_at) order updated_at desc limit 5":
    [{ id: "p1", title: "SGECHAT", published: true, archived_at: null, updated_at: "2026-09-27T12:00:00Z" }]
};

function respond(overrides = {}) {
  return (key) => {
    if (key in overrides) return overrides[key];
    if (key === "projects select(published, archived_at)") return { data: projectRows, error: null };
    if (key === "services select(active)") return { data: serviceRows, error: null };
    if (key === "technologies select(active)") return { data: technologyRows, error: null };
    if (key === "contacts select(status)") return { data: contactRows, error: null };
    if (key in listed) return { data: listed[key], error: null };
    if (key.startsWith("site_settings")) return { data: { email: "a@b.co", whatsapp: null, linkedin_url: "", github_url: "https://github.com/x", profile_image: null }, error: null };
    throw new Error(`Unexpected query: ${key}`);
  };
}

const loadDashboard = () => loadTs("src/lib/repositories/dashboard.ts");

test("dashboard aggregates counts with the right filters and lists recent items", async () => {
  const db = fakeDb(respond());
  const data = plain(await loadDashboard().getDashboardData(db));
  assert.deepEqual(data.projects, { total: 5, published: 3, drafts: 1, archived: 1 });
  assert.deepEqual(data.services, { total: 8, active: 7 });
  assert.deepEqual(data.technologies, { total: 32, active: 30 });
  assert.deepEqual(data.contacts, { total: 4, new: 2 });
  assert.equal(data.recentContacts[0].name, "Ana");
  assert.equal(data.recentProjects[0].title, "SGECHAT");
  assert.ok(db.log.includes("contacts select(id, name, company, project_type, status, created_at) order created_at desc limit 5"));
  assert.ok(db.log.includes("projects select(id, title, published, archived_at, updated_at) order updated_at desc limit 5"));
});

test("dashboard lists empty public contact fields; null when settings row is missing", async () => {
  const withRow = plain(await loadDashboard().getDashboardData(fakeDb(respond())));
  assert.deepEqual(withRow.missingSettings, ["WhatsApp", "LinkedIn", "Foto profissional"]);
  const missing = plain(await loadDashboard().getDashboardData(fakeDb(respond({
    "site_settings select(email, whatsapp, linkedin_url, github_url, profile_image) single": { data: null, error: null }
  }))));
  assert.equal(missing.missingSettings, null);
});

test("dashboard errors never expose database details to the page", async (t) => {
  const logged = t.mock.method(console, "error", () => {});
  await assert.rejects(
    loadDashboard().getDashboardData(fakeDb(respond({ "contacts select(status)": { data: null, error: { message: "relation secret_table" } } }))),
    (error) => error.message === "Não foi possível carregar o dashboard." && !error.message.includes("secret")
  );
  assert.match(logged.mock.calls[0].arguments[0], /secret_table/);
});
