// Minimal HTTP helpers for E2E tests against `next start` (no browser).
// Forms are submitted without JavaScript, the way React/Next progressive
// enhancement handles Server Actions: hidden $ACTION_* inputs + fields.

export const BASE = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3431";

export function jarFrom(res, jar = new Map()) {
  for (const cookie of res.headers.getSetCookie()) {
    const [pair, ...attrs] = cookie.split(";");
    const index = pair.indexOf("=");
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1);
    const expired = attrs.some((a) => /max-age=0/i.test(a) || /expires=Thu, 01 Jan 1970/i.test(a));
    if (expired || value === "") jar.delete(name);
    else jar.set(name, value);
  }
  return jar;
}

export const cookieHeader = (jar) => [...jar].map(([k, v]) => `${k}=${v}`).join("; ");
export const authCookies = (jar) => [...jar.keys()].filter((k) => /^sb-.*-auth-token/.test(k));
export const get = (path, jar) =>
  fetch(BASE + path, { redirect: "manual", headers: jar ? { cookie: cookieHeader(jar) } : {} });

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

/** Hidden inputs of the form tagged with data-form="<marker>" (or the first form). */
export function hiddenInputs(html, marker) {
  const forms = [...html.matchAll(/<form([^>]*)>([\s\S]*?)<\/form>/g)];
  const form = marker ? forms.find((m) => m[1].includes(`data-form="${marker}"`)) : forms[0];
  if (!form) throw new Error(`Form not found: ${marker ?? "first"}`);
  return [...form[2].matchAll(/<input[^>]*type="hidden"[^>]*>/g)].map((m) => [
    decode(/name="([^"]*)"/.exec(m[0])?.[1] ?? ""),
    decode(/value="([^"]*)"/.exec(m[0])?.[1] ?? "")
  ]);
}

/** Posts a form; `fields` values may be arrays and override hidden inputs with the same name. */
export async function postForm(path, html, marker, fields, jar) {
  const body = new FormData();
  for (const [name, value] of hiddenInputs(html, marker)) if (!(name in fields)) body.append(name, value);
  for (const [name, value] of Object.entries(fields)) for (const item of [].concat(value)) body.append(name, item);
  return fetch(BASE + path, { method: "POST", body, redirect: "manual", headers: jar ? { cookie: cookieHeader(jar) } : {} });
}

export async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { await fetch(`${BASE}/robots.txt`); return; } catch { await new Promise((r) => setTimeout(r, 500)); }
  }
  throw new Error(`Servidor indisponível em ${BASE}`);
}

/** Logs in through the real /admin/login form and returns the session cookie jar. */
export async function loginThroughForm(email, password) {
  const html = await (await get("/admin/login")).text();
  const res = await postForm("/admin/login", html, null, { email, password });
  if (res.status !== 303) throw new Error(`Login falhou para ${email}: HTTP ${res.status}`);
  return jarFrom(res);
}

export function reporter(name) {
  const results = [];
  return {
    check(label, condition, extra = "") {
      results.push(`${condition ? "PASS" : "FAIL"} ${label}${condition ? "" : ` :: ${extra}`}`);
    },
    finish() {
      console.log(results.join("\n"));
      const failed = results.some((r) => r.startsWith("FAIL"));
      console.log(`${name}: ${failed ? "FAILURES" : "ALL PASS"} (${results.filter((r) => r.startsWith("PASS")).length}/${results.length})`);
      if (failed) process.exitCode = 1;
    }
  };
}
