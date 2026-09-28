import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";

const SITE = { NEXT_PUBLIC_SITE_URL: "https://jhconsulting.dev/" };

const loadSitemap = (projects, settings) =>
  loadTs("src/app/sitemap.ts", {
    env: SITE,
    mocks: {
      "@/lib/repositories/public-projects": { listPublishedProjectSlugs: async () => projects },
      "@/lib/repositories/public-settings": { getSiteSettings: async () => settings }
    }
  });

const iso = (value) => new Date(value).toISOString();

test("sitemap: urls drop the trailing slash and cover every published project", async () => {
  const projects = [
    { slug: "alfa", updatedAt: "2026-03-01T10:00:00Z" },
    { slug: "beta", updatedAt: "2026-05-02T10:00:00Z" }
  ];
  const entries = plain(await loadSitemap(projects, { updatedAt: "2026-01-01T10:00:00Z" }).default());
  assert.deepEqual(
    entries.map((entry) => entry.url),
    ["https://jhconsulting.dev", "https://jhconsulting.dev/projetos", "https://jhconsulting.dev/projetos/alfa", "https://jhconsulting.dev/projetos/beta"]
  );
  assert.equal(entries[0].priority, 1);
});

test("sitemap: lastModified reflects real content changes, not the render time", async () => {
  const projects = [
    { slug: "alfa", updatedAt: "2026-03-01T10:00:00Z" },
    { slug: "beta", updatedAt: "2026-05-02T10:00:00Z" }
  ];
  // Settings changed after every project: the home must follow the newest of all.
  const entries = plain(await loadSitemap(projects, { updatedAt: "2026-07-09T08:00:00Z" }).default());
  assert.equal(iso(entries[0].lastModified), iso("2026-07-09T08:00:00Z"));
  assert.equal(iso(entries[1].lastModified), iso("2026-05-02T10:00:00Z"), "a listagem segue só os projetos");
  assert.equal(iso(entries[3].lastModified), iso("2026-05-02T10:00:00Z"));

  const older = plain(await loadSitemap(projects, { updatedAt: "2026-01-01T10:00:00Z" }).default());
  assert.equal(iso(older[0].lastModified), iso("2026-05-02T10:00:00Z"), "o mais recente vence");
});

test("sitemap: missing or invalid dates degrade to now instead of an invalid date", async () => {
  const before = Date.now();
  const entries = plain(await loadSitemap([{ slug: "alfa", updatedAt: "não é data" }], { updatedAt: null }).default());
  for (const entry of entries) {
    const time = new Date(entry.lastModified).getTime();
    assert.ok(Number.isFinite(time), `data inválida em ${entry.url}`);
    assert.ok(time >= before - 1000, `data deveria ser agora em ${entry.url}`);
  }
});

const loadJsonLd = () =>
  loadTs("src/components/seo/JsonLd.tsx", {
    mocks: { "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) } }
  });

test("JSON-LD: editable text cannot break out of the script tag", () => {
  const { JsonLd } = loadJsonLd();
  const element = JsonLd({ data: { name: 'Fim </script><script>alert("x")</script>', "@type": "CreativeWork" } });
  const html = element.props.dangerouslySetInnerHTML.__html;
  assert.equal(element.props.type, "application/ld+json");
  assert.equal(html.includes("</script>"), false, "a tag de fechamento não pode sobreviver");
  assert.equal(html.includes("\\u003c"), true);
  assert.deepEqual(JSON.parse(html.replaceAll("\\u003c", "<")).name, 'Fim </script><script>alert("x")</script>');
});
