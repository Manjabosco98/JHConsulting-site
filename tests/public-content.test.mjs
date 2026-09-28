import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const COVER = `projects/${PROJECT_ID}/22222222-2222-4222-8222-222222222222.png`;
const lucide = { "lucide-react": new Proxy({}, { get: (_target, name) => name }) };

const loadPublic = (file, db, extra = {}) =>
  loadTs(file, { mocks: { "@/lib/supabase/public": { createPublicClient: () => db }, ...lucide, ...extra } });

// ---------------------------------------------------------------- projetos

const projectRow = (overrides = {}) => ({
  id: PROJECT_ID,
  slug: "case-alfa",
  title: "Case Alfa",
  category: "Automação",
  status: "Case técnico",
  short_description: "Resumo.",
  problem: "Problema.",
  solution: "Solução.",
  featured: true,
  cover_image: COVER,
  // Fora de ordem de propósito: a ordem de exibição vem de display_order.
  project_technologies: [
    { display_order: 2, technologies: { name: "SQL" } },
    { display_order: 0, technologies: { name: "Python" } },
    { display_order: 1, technologies: { name: "Playwright" } }
  ],
  ...overrides
});

test("projetos públicos: tecnologias saem na ordem de exibição e a capa vira URL", async () => {
  const db = fakeDb(() => ({ data: [projectRow()], error: null }));
  const [project] = plain(await loadPublic("src/lib/repositories/public-projects.ts", db).listPublishedProjects());
  assert.deepEqual(project.technologies, ["Python", "Playwright", "SQL"]);
  assert.equal(project.shortDescription, "Resumo.");
  assert.match(project.coverUrl, /\/storage\/v1\/object\/public\/portfolio\/projects\//);
  assert.match(db.log[0], /^projects select\(.*\) order display_order asc order created_at desc$/);
});

test("projetos públicos: vínculo sem tecnologia visível é descartado, sem capa fica null", async () => {
  const row = projectRow({
    cover_image: null,
    // O RLS esconde a tecnologia inativa, mas o vínculo ainda vem no join.
    project_technologies: [
      { display_order: 0, technologies: { name: "Python" } },
      { display_order: 1, technologies: null }
    ]
  });
  const db = fakeDb(() => ({ data: [row], error: null }));
  const [project] = plain(await loadPublic("src/lib/repositories/public-projects.ts", db).listPublishedProjects());
  assert.deepEqual(project.technologies, ["Python"]);
  assert.equal(project.coverUrl, null);
});

test("projetos públicos: sem vínculos e sem linhas não quebra", async () => {
  const empty = fakeDb(() => ({ data: null, error: null }));
  assert.deepEqual(plain(await loadPublic("src/lib/repositories/public-projects.ts", empty).listPublishedProjects()), []);

  const noLinks = fakeDb(() => ({ data: [projectRow({ project_technologies: null })], error: null }));
  const [project] = plain(await loadPublic("src/lib/repositories/public-projects.ts", noLinks).listPublishedProjects());
  assert.deepEqual(project.technologies, []);
});

test("projetos públicos: detalhe mapeia os campos extras e devolve null quando não existe", async () => {
  const row = { ...projectRow(), description: "Um.\n\nDois.", repository_url: "https://github.com/x", demo_url: null, published_at: "2026-01-02T03:04:05Z", updated_at: "2026-02-03T04:05:06Z" };
  const found = fakeDb(() => ({ data: row, error: null }));
  const project = plain(await loadPublic("src/lib/repositories/public-projects.ts", found).getPublishedProjectBySlug("case-alfa"));
  assert.equal(project.repositoryUrl, "https://github.com/x");
  assert.equal(project.demoUrl, null);
  assert.equal(project.updatedAt, "2026-02-03T04:05:06Z");
  assert.match(found.log[0], /slug=case-alfa single$/);

  const missing = fakeDb(() => ({ data: null, error: null }));
  assert.equal(await loadPublic("src/lib/repositories/public-projects.ts", missing).getPublishedProjectBySlug("nada"), null);
});

test("projetos públicos: listas lançam com contexto, mas os slugs nunca lançam", async (t) => {
  const logged = t.mock.method(console, "error", () => {});
  const broken = fakeDb(() => ({ data: null, error: { message: "conexão caiu" } }));
  const repo = loadPublic("src/lib/repositories/public-projects.ts", broken);

  await assert.rejects(repo.listPublishedProjects(), /listPublishedProjects: conexão caiu/);
  await assert.rejects(repo.getPublishedProjectBySlug("x"), /getPublishedProjectBySlug: conexão caiu/);
  // O sitemap e o generateStaticParams dependem disto: falha vira lista vazia.
  assert.deepEqual(plain(await repo.listPublishedProjectSlugs()), []);
  assert.match(logged.mock.calls.at(-1).arguments[0], /conexão caiu/);
});

// ---------------------------------------------------------------- serviços

test("serviços públicos: ordem da consulta e erro com contexto", async () => {
  const db = fakeDb(() => ({ data: [{ id: "s1", title: "Automação", description: "d", icon: "Bot", tech: "Python" }], error: null }));
  const services = plain(await loadPublic("src/lib/repositories/public-services.ts", db).listActiveServices());
  assert.equal(services[0].icon, "Bot");
  assert.equal(db.log[0], "services select(id, title, description, icon, tech) order display_order asc order created_at desc");

  const broken = fakeDb(() => ({ data: null, error: { message: "sem rede" } }));
  await assert.rejects(loadPublic("src/lib/repositories/public-services.ts", broken).listActiveServices(), /listActiveServices: sem rede/);
});

// ------------------------------------------------------------- tecnologias

test("tecnologias públicas: membros seguem display_order e vínculo órfão é descartado", async () => {
  const db = fakeDb(() => ({
    data: [
      {
        id: "g1",
        name: "Backend",
        technology_group_members: [
          { display_order: 1, technologies: { name: "FastAPI" } },
          { display_order: 0, technologies: { name: "Python" } },
          { display_order: 2, technologies: null }
        ]
      },
      { id: "g2", name: "Dados", technology_group_members: [] }
    ],
    error: null
  }));
  const groups = plain(await loadPublic("src/lib/repositories/public-technologies.ts", db).listPublicTechnologyGroups());
  assert.deepEqual(groups[0], { id: "g1", name: "Backend", technologies: ["Python", "FastAPI"] });
  assert.deepEqual(groups[1].technologies, []);

  const broken = fakeDb(() => ({ data: null, error: { message: "timeout" } }));
  await assert.rejects(loadPublic("src/lib/repositories/public-technologies.ts", broken).listPublicTechnologyGroups(), /listPublicTechnologyGroups: timeout/);
});

// --------------------------------------------- seções: degradação da Fase 14

/**
 * Collects every rendered string from the element tree produced by the jsx mock.
 * The mock only records `{ type, props }`, so a component type has to be called
 * here to reach the text it renders (that is where ProjectCard puts the title).
 */
function texts(node) {
  if (node === null || node === undefined || typeof node === "boolean") return [];
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(texts);
  if (typeof node === "object" && node.props) {
    return typeof node.type === "function" ? texts(node.type(node.props)) : texts(node.props.children);
  }
  return [];
}

const jsxRuntime = {
  "react/jsx-runtime": {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props }),
    Fragment: "fragment"
  }
};

const sectionMocks = {
  ...jsxRuntime,
  ...lucide,
  "next/link": { default: ({ children }) => ({ type: "a", props: { children } }) },
  "@/components/ui/Reveal": { Reveal: ({ children }) => ({ type: "reveal", props: { children } }) },
  "@/components/projects/ProjectCard": { ProjectCard: ({ project }) => ({ type: "card", props: { children: project.title } }) }
};

const loadSection = (file, repoModule, repoExport, behaviour) =>
  loadTs(file, {
    mocks: {
      ...sectionMocks,
      [repoModule]: { [repoExport]: behaviour }
    }
  });

const cases = [
  {
    label: "Serviços",
    file: "src/components/sections/Services.tsx",
    component: "Services",
    module: "@/lib/repositories/public-services",
    fn: "listActiveServices",
    rows: [{ id: "s1", title: "Automação de Processos", description: "d", icon: "Bot", tech: "Python" }],
    present: "Automação de Processos",
    empty: "Serviços serão publicados em breve."
  },
  {
    label: "Tecnologias",
    file: "src/components/sections/Technologies.tsx",
    component: "Technologies",
    module: "@/lib/repositories/public-technologies",
    fn: "listPublicTechnologyGroups",
    rows: [{ id: "g1", name: "Backend", technologies: ["Python"] }],
    present: "Backend",
    empty: "Tecnologias serão publicadas em breve."
  },
  {
    label: "Projetos",
    file: "src/components/sections/Projects.tsx",
    component: "Projects",
    module: "@/lib/repositories/public-projects",
    fn: "listPublishedProjects",
    rows: [{ id: "p1", slug: "alfa", title: "Case Alfa", category: "c", status: "s", shortDescription: "r", problem: "p", solution: "s", featured: false, coverUrl: null, technologies: [] }],
    present: "Case Alfa",
    empty: "Novos projetos serão publicados em breve."
  }
];

for (const item of cases) {
  test(`seção ${item.label}: mostra o conteúdo do banco`, async () => {
    const section = loadSection(item.file, item.module, item.fn, async () => item.rows);
    const rendered = texts(await section[item.component]());
    assert.ok(rendered.includes(item.present), `esperava "${item.present}" em ${rendered.join(" | ").slice(0, 200)}`);
    assert.equal(rendered.includes(item.empty), false);
  });

  // Decisão da Fase 14: em falha, estado neutro em vez de cópia embutida.
  test(`seção ${item.label}: falha de consulta degrada para o estado neutro`, async (t) => {
    const logged = t.mock.method(console, "error", () => {});
    const section = loadSection(item.file, item.module, item.fn, async () => {
      throw new Error("banco indisponível");
    });
    const rendered = texts(await section[item.component]());
    assert.ok(rendered.includes(item.empty), `esperava "${item.empty}"`);
    assert.equal(rendered.includes(item.present), false, "não pode mostrar dado embutido");
    assert.match(logged.mock.calls.at(-1).arguments[0], /banco indisponível/);
  });
}
