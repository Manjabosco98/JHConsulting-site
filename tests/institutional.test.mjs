import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";

const jsx = {
  "react/jsx-runtime": {
    jsx: (type, props) => ({ type, props }),
    jsxs: (type, props) => ({ type, props })
  }
};
const icons = { "lucide-react": new Proxy({}, { get: (_target, key) => key }) };
const personalSettings = {
  companyName: "JHConsulting", professionalName: "PESSOA_LEGADA", role: "CARGO_LEGADO",
  bio: ["BIO_LEGADA"], profileImageUrl: "https://example.com/RETRATO_LEGADO.png",
  githubUrl: "https://github.com/PERFIL_PESSOAL", linkedinUrl: "https://linkedin.com/in/PESSOAL",
  location: "Goiânia, Goiás, Brasil", serviceArea: "Atendimento remoto em todo o Brasil",
  email: "comercial@example.com", whatsapp: "5562900000000"
};
const mocks = {
  ...jsx, ...icons,
  "@/lib/repositories/public-settings": { getSiteSettings: async () => personalSettings }
};
function text(node) {
  if (node == null || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(text).join(" ");
  if (typeof node === "object") return text(typeof node.type === "function" ? node.type(node.props) : node.props?.children);
  return String(node);
}

test("corporate presentation and footer do not expose legacy personal content", async () => {
  for (const [file, name] of [["About", "About"], ["../layout/Footer", "Footer"]]) {
    const path = file === "About" ? "src/components/sections/About.tsx" : "src/components/layout/Footer.tsx";
    const rendered = await loadTs(path, { mocks })[name]();
    const serialized = JSON.stringify(rendered);
    for (const token of ["PESSOA_LEGADA", "CARGO_LEGADO", "BIO_LEGADA", "RETRATO_LEGADO", "PERFIL_PESSOAL", "linkedin.com"])
      assert.equal(serialized.includes(token), false, token);
    assert.ok(text(rendered).includes("Goiânia"));
  }
  const about = await loadTs("src/components/sections/About.tsx", { mocks }).About();
  assert.equal(about.props.id, "empresa");
});

test("main navigation has only company, services, process and contact destinations", () => {
  const { siteConfig } = loadTs("src/constants/site.ts");
  assert.deepEqual(plain(siteConfig.nav), [
    ["Início", "#inicio"], ["Empresa", "#empresa"], ["Serviços", "#servicos"],
    ["Como trabalhamos", "#como-trabalhamos"], ["Contato", "#contato"]
  ]);
});

test("old listing and detail URLs permanently redirect without reading project data", () => {
  for (const path of ["src/app/projetos/page.tsx", "src/app/projetos/[slug]/page.tsx"]) {
    const calls = [];
    const module = loadTs(path, { mocks: { "next/navigation": { permanentRedirect: (url) => {
      calls.push(url);
      throw new Error("REDIRECT_308");
    } } } });
    assert.throws(() => module.default(), /REDIRECT_308/);
    assert.deepEqual(calls, ["/#servicos"]);
  }
});

test("portfolio redirect runs before metadata or page streaming", async () => {
  const config = loadTs("next.config.ts", { env: {} }).default;
  const redirects = plain(await config.redirects());
  assert.deepEqual(redirects.find(item => item.source === "/projetos/:path*"),
    { source: "/projetos/:path*", destination: "/#servicos", permanent: true });
  assert.deepEqual(redirects.find(item => item.source === "/admin/projetos/:path*"),
    { source: "/admin/projetos/:path*", destination: "/admin", permanent: false });
});

test("WhatsApp addresses the company and falls back to the contact section", () => {
  const { whatsappLink } = loadTs("src/lib/whatsapp.ts");
  assert.equal(whatsappLink(null), "#contato");
  const url = new URL(whatsappLink("+55 (62) 90000-0000"));
  assert.equal(url.pathname, "/5562900000000");
  assert.match(url.searchParams.get("text"), /JHConsulting/);
  assert.doesNotMatch(url.searchParams.get("text"), /João|projeto/i);
});
