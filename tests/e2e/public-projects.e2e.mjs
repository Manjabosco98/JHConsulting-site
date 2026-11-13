// Read-only regression for the retired public portfolio. No users, writes or email.
import assert from "node:assert/strict";

const base = process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173";
let checks = 0;
function check(name, value) {
  assert.ok(value, name);
  console.log("PASS", name);
  checks++;
}

const homeResponse = await fetch(base);
check("home 200", homeResponse.status === 200);
const home = (await homeResponse.text()).replace(/<!-- -->/g, "");
// Only inspect the rendered HTML, not the serialized React payload.
const visible = home.replace(/<script[\s\S]*?<\/script>/g, "");
check("corporate headline", visible.includes("Automação e dados para uma gestão"));
check("company and services sections", visible.includes('id="empresa"') && visible.includes('id="servicos"'));
check("no public project links", !/href="[^"]*\/projetos/.test(visible));
check("no portfolio or personal biography", !/Sobre João|Projetos e soluções|Case técnico|Foto de João|Transformo processos/.test(visible));
check("service inquiry label", visible.includes("Serviço de interesse"));
check("FAQ available without JavaScript", visible.includes("<details") && visible.includes("<summary"));
check("no personal social profile links", !/github.com\/Manjabosco98|linkedin.com\/in\//.test(visible));
check("all five navigation anchors exist", ["inicio", "empresa", "servicos", "como-trabalhamos", "contato"].every((id) => visible.includes(`id="${id}"`)));
for (const path of ["/projetos", "/projetos/tag-view", "/projetos/qualquer-slug"]) {
  const response = await fetch(base + path, { redirect: "manual" });
  check(`${path}: permanent redirect to services`, response.status === 308 && response.headers.get("location")?.endsWith("/#servicos"));
}
const map = await (await fetch(base + "/sitemap.xml")).text();
check("sitemap excludes portfolio", !map.includes("/projetos") && (map.match(/<loc>/g) ?? []).length === 1);
const blocks = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const business = blocks.find((block) => block["@type"] === "ProfessionalService");
check("SEO describes the company and its services", business?.name === "JHConsulting" && business.hasOfferCatalog.itemListElement.length > 0 && !business.founder && !business.image);
const og = await fetch(base + "/opengraph-image");
check("corporate sharing image is available", og.status === 200 && og.headers.get("content-type")?.includes("image/png"));
const admin = await fetch(base + "/admin", { redirect: "manual" });
check("admin remains protected", [303, 307, 308].includes(admin.status) && admin.headers.get("location")?.includes("/admin/login"));
console.log(`${checks} checks passed.`);
