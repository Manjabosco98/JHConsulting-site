import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";

const loadSitemap = (updatedAt) => loadTs("src/app/sitemap.ts", {
  env: { NEXT_PUBLIC_SITE_URL: "https://jhconsulting.dev/" },
  mocks: {
    "@/lib/repositories/public-settings": { getSiteSettings: async () => ({ updatedAt }) },
    "@/lib/repositories/public-projects": { listPublishedProjectSlugs: () => { throw new Error("O sitemap não deve consultar o portfólio."); } }
  }
});

test("sitemap: only the corporate home is indexed, with no portfolio URLs", async () => {
  const entries = plain(await loadSitemap("2026-07-09T08:00:00Z").default());
  assert.deepEqual(entries.map((entry) => entry.url), ["https://jhconsulting.dev"]);
  assert.equal(entries[0].priority, 1);
  assert.equal(new Date(entries[0].lastModified).toISOString(), "2026-07-09T08:00:00.000Z");
});

test("sitemap: unknown dates are omitted rather than publishing a false update", async () => {
  for (const value of [null, "data inválida"]) {
    const [entry] = plain(await loadSitemap(value).default());
    assert.equal("lastModified" in entry, false);
    assert.equal(entry.changeFrequency, "monthly");
  }
});

test("JSON-LD: editable text cannot break out of the script tag", () => {
  const { JsonLd } = loadTs("src/components/seo/JsonLd.tsx", {
    mocks: { "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) } }
  });
  const name = 'Fim </script><script>alert("x")</script>';
  const element = JsonLd({ data: { name, "@type": "ProfessionalService" } });
  const html = element.props.dangerouslySetInnerHTML.__html;
  assert.equal(element.props.type, "application/ld+json");
  assert.equal(html.includes("</script>"), false);
  assert.equal(JSON.parse(html).name, name);
});
