import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";
import { fakeDb } from "./helpers/fake-db.mjs";

const CONTACT_ID = "77777777-7777-4777-8777-777777777777";
const validation = () => loadTs("src/lib/validation/contact.ts");

const validPayload = {
  name: "  Maria Souza  ",
  company: " ACME ",
  email: " maria@acme.com.br ",
  whatsapp: " (11) 99999-0000 ",
  projectType: "Automação",
  message: "Precisamos automatizar a conciliação de notas fiscais.\r\nHoje é tudo manual.",
  website: ""
};

test("contact payload: trims, normalizes CRLF and maps to the database columns", () => {
  const { parseContactPayload, toContactRow } = validation();
  const result = parseContactPayload(validPayload);
  assert.equal(result.success, true);
  assert.deepEqual(plain(result.data), {
    name: "Maria Souza",
    company: "ACME",
    email: "maria@acme.com.br",
    whatsapp: "(11) 99999-0000",
    projectType: "Automação",
    message: "Precisamos automatizar a conciliação de notas fiscais.\nHoje é tudo manual.",
    website: ""
  });
  assert.deepEqual(plain(toContactRow(result.data)), {
    name: "Maria Souza",
    company: "ACME",
    email: "maria@acme.com.br",
    whatsapp: "(11) 99999-0000",
    project_type: "Automação",
    message: "Precisamos automatizar a conciliação de notas fiscais.\nHoje é tudo manual.",
    source: "SITE"
  });
});

test("contact payload: optional fields default to empty and unknown keys are ignored", () => {
  const { parseContactPayload } = validation();
  const result = parseContactPayload({
    name: "João",
    email: "joao@example.com",
    projectType: "API",
    message: "x".repeat(20),
    utm_source: "google"
  });
  assert.equal(result.success, true);
  assert.equal(result.data.company, "");
  assert.equal(result.data.whatsapp, "");
  assert.equal(result.data.website, "");
  assert.equal("utm_source" in plain(result.data), false);
});

test("contact payload: rejects every limit that the database also rejects", () => {
  const { parseContactPayload } = validation();
  const invalid = [
    { ...validPayload, name: " a " },
    { ...validPayload, name: "x".repeat(101) },
    { ...validPayload, email: "sem-arroba" },
    { ...validPayload, email: "com espaco@x.com" },
    { ...validPayload, email: "sem@dominio" },
    { ...validPayload, email: `${"x".repeat(160)}@acme.com` },
    { ...validPayload, company: "x".repeat(121) },
    { ...validPayload, whatsapp: "9".repeat(41) },
    { ...validPayload, projectType: "a" },
    { ...validPayload, projectType: "x".repeat(81) },
    { ...validPayload, message: "curta demais" },
    { ...validPayload, message: `${" ".repeat(50)}curta` },
    { ...validPayload, message: "x".repeat(4001) }
  ];
  for (const payload of invalid) {
    assert.equal(parseContactPayload(payload).success, false, JSON.stringify(payload).slice(0, 80));
  }
});

test("contact payload: a body that is not an object is refused, not crashed on", () => {
  const { parseContactPayload } = validation();
  for (const body of [null, undefined, "texto", 42, [], [validPayload], true]) {
    assert.equal(parseContactPayload(body).success, false, JSON.stringify(body ?? null));
  }
});

const loadRepo = () => loadTs("src/lib/repositories/contacts.ts");
const row = {
  name: "Maria",
  company: "",
  email: "maria@acme.com",
  whatsapp: "",
  project_type: "API",
  message: "x".repeat(20),
  source: "SITE"
};

test("repository: storing a lead inserts the granted columns and reads back only the id", async () => {
  const db = fakeDb(() => ({ data: [{ id: CONTACT_ID }], error: null }));
  assert.deepEqual(plain(await loadRepo().storeContact(db, row)), { ok: true, id: CONTACT_ID });
  assert.match(db.log[0], /^contacts insert\(.*"source":"SITE".*\) select\(id\)$/);
});

test("repository: store failures are classified and never leak the visitor text", async (t) => {
  const logged = t.mock.method(console, "error", () => {});
  const { storeContact } = loadRepo();
  const cases = [
    ["42501", "denied"],
    ["23514", "invalid"],
    ["22001", "invalid"],
    ["XX000", "unknown"]
  ];
  for (const [code, reason] of cases) {
    const db = fakeDb(() => ({ data: null, error: { code, message: row.message } }));
    assert.equal((await storeContact(db, row)).reason, reason, code);
  }
  const empty = fakeDb(() => ({ data: [], error: null }));
  assert.equal((await storeContact(empty, row)).reason, "unknown");
  for (const call of logged.mock.calls) {
    assert.doesNotMatch(call.arguments[0], /x{20}/);
  }
});

test("repository: list filters by status, orders by newest and caps the page", async () => {
  const { listAdminContacts, CONTACT_LIST_LIMIT } = loadRepo();
  const all = fakeDb(() => ({ data: [], error: null }));
  await listAdminContacts(all);
  assert.equal(all.log[0], `contacts select(id, name, company, email, whatsapp, project_type, message, status, source, created_at, updated_at) order created_at desc limit ${CONTACT_LIST_LIMIT}`);

  const filtered = fakeDb(() => ({ data: [], error: null }));
  await listAdminContacts(filtered, "NEW");
  assert.match(filtered.log[0], /status=NEW order created_at desc/);
});

test("repository: get reads a single row and list failures stay generic", async (t) => {
  const logged = t.mock.method(console, "error", () => {});
  const { getAdminContact, listAdminContacts } = loadRepo();
  const found = fakeDb(() => ({ data: { id: CONTACT_ID }, error: null }));
  assert.equal((await getAdminContact(found, CONTACT_ID)).id, CONTACT_ID);
  assert.match(found.log[0], new RegExp(`id=${CONTACT_ID} single$`));

  const broken = fakeDb(() => ({ data: null, error: { message: "relation missing" } }));
  await assert.rejects(listAdminContacts(broken), /Não foi possível carregar os contatos\./);
  assert.match(logged.mock.calls.at(-1).arguments[0], /relation missing/);
});

test("repository: counts one head query per status plus the total", async () => {
  const counts = { "contacts count": 9, "contacts count status=NEW": 4, "contacts count status=CONTACTED": 2, "contacts count status=NEGOTIATING": 1, "contacts count status=CONVERTED": 1, "contacts count status=ARCHIVED": 1 };
  const db = fakeDb((key) => ({ count: counts[key] ?? 0, error: null }));
  const result = plain(await loadRepo().countContactsByStatus(db));
  assert.deepEqual(result, { total: 9, NEW: 4, CONTACTED: 2, NEGOTIATING: 1, CONVERTED: 1, ARCHIVED: 1 });
  assert.equal(db.log.length, 6);
});

test("repository: status update touches only status and reports a missing row", async () => {
  const { updateContactStatus } = loadRepo();
  const ok = fakeDb(() => ({ data: [{ id: CONTACT_ID }], error: null }));
  assert.deepEqual(plain(await updateContactStatus(ok, CONTACT_ID, "CONTACTED")), { ok: true });
  assert.equal(ok.log[0], `contacts update({"status":"CONTACTED"}) id=${CONTACT_ID} select(id)`);

  const missing = fakeDb(() => ({ data: [], error: null }));
  assert.equal((await updateContactStatus(missing, CONTACT_ID, "NEW")).reason, "not_found");
  const denied = fakeDb(() => ({ data: null, error: { code: "42501", message: "rls" } }));
  assert.equal((await updateContactStatus(denied, CONTACT_ID, "NEW")).reason, "forbidden");
});

function loadNotify({ send, env = {} } = {}) {
  const sent = [];
  class Resend {
    constructor(key) { this.key = key; }
    emails = {
      send: async (message) => {
        sent.push(message);
        return send ? send(message) : { data: { id: "email_1" }, error: null };
      }
    };
  }
  const notify = loadTs("src/lib/contact/notify.ts", {
    mocks: { resend: { Resend } },
    env: {
      RESEND_API_KEY: "re_test_key",
      CONTACT_TO_EMAIL: "lead@jhconsulting.dev",
      CONTACT_FROM_EMAIL: "site@jhconsulting.dev",
      NEXT_PUBLIC_SITE_URL: "https://jhconsulting.dev/",
      ...env
    }
  });
  return { notify, sent };
}
const payload = {
  name: "Maria",
  company: "ACME",
  email: "maria@acme.com",
  whatsapp: "11999990000",
  projectType: "API",
  message: "Mensagem com detalhes suficientes.",
  website: ""
};

test("notify: sends the lead with reply-to and a link to the panel", async () => {
  const { notify, sent } = loadNotify();
  assert.deepEqual(plain(await notify.notifyNewContact(payload, CONTACT_ID)), { ok: true });
  assert.equal(sent[0].replyTo, "maria@acme.com");
  assert.equal(sent[0].subject, "Novo lead JHConsulting — API");
  assert.match(sent[0].text, /Nome: Maria/);
  assert.match(sent[0].text, /Mensagem com detalhes suficientes\./);
  assert.equal(sent[0].text.includes(`https://jhconsulting.dev/admin/contatos/${CONTACT_ID}`), true);
});

test("notify: reports missing configuration without calling Resend", async () => {
  const { notify, sent } = loadNotify({ env: { RESEND_API_KEY: "" } });
  assert.deepEqual(plain(await notify.notifyNewContact(payload)), { ok: false, reason: "not_configured" });
  assert.equal(sent.length, 0);
});

test("email config: every one of the three variables is required", () => {
  const config = (env) => loadTs("src/lib/contact/config.ts", { env });
  const full = { RESEND_API_KEY: "re_test", CONTACT_FROM_EMAIL: "site@x.com", CONTACT_TO_EMAIL: "lead@x.com" };
  assert.equal(config(full).hasEmailConfig(), true);
  for (const name of Object.keys(full)) {
    assert.equal(config({ ...full, [name]: "   " }).hasEmailConfig(), false, name);
    assert.equal(config({ ...full, [name]: undefined }).hasEmailConfig(), false, name);
  }
});

test("notify: a rejected send and a thrown SDK error both become a handled failure", async (t) => {
  t.mock.method(console, "error", () => {});
  const rejected = loadNotify({ send: () => ({ data: null, error: { message: "domain not verified" } }) });
  assert.deepEqual(plain(await rejected.notify.notifyNewContact(payload)), { ok: false, reason: "failed" });

  const thrown = loadNotify({ send: () => { throw new Error("socket hang up"); } });
  assert.deepEqual(plain(await thrown.notify.notifyNewContact(payload)), { ok: false, reason: "failed" });
});

const MALFORMED = Symbol("malformed json");

function loadRoute({ hasKey = true, store, notify } = {}) {
  const calls = [];
  const route = loadTs("src/app/api/contact/route.ts", {
    mocks: {
      "next/server": { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } },
      "@/lib/supabase/secret": {
        hasSupabaseSecretKey: () => hasKey,
        createSecretClient: () => ({ client: true })
      },
      "@/lib/repositories/contacts": {
        storeContact: async () => {
          calls.push("store");
          return store ? store() : { ok: true, id: CONTACT_ID };
        }
      },
      "@/lib/contact/notify": {
        notifyNewContact: async (_payload, contactId) => {
          calls.push(`notify:${contactId}`);
          return notify ? notify() : { ok: true };
        }
      }
    }
  });
  return { route, calls };
}

/** Minimal stand-in for the request body stream, so the size cap is exercised. */
function bodyStream(chunks) {
  let index = 0;
  let cancelled = false;
  return {
    getReader: () => ({
      read: async () =>
        !cancelled && index < chunks.length ? { done: false, value: chunks[index++] } : { done: true },
      cancel: async () => {
        cancelled = true;
      }
    })
  };
}

const encoder = new TextEncoder();

const request = (body, ip = "203.0.113.10", options = {}) => {
  const text = body === MALFORMED ? "{isso-nao-e-json" : JSON.stringify(body);
  const chunks = options.chunks ?? [encoder.encode(text)];
  const declared = "contentLength" in options ? options.contentLength : chunks.reduce((total, chunk) => total + chunk.byteLength, 0);
  return {
    headers: {
      get: (name) => {
        if (name === "x-forwarded-for") return ip;
        if (name === "content-length") return declared === null ? null : String(declared);
        return null;
      }
    },
    body: bodyStream(chunks)
  };
};

test("endpoint: malformed JSON is a 400, not a 500", async () => {
  const { route, calls } = loadRoute();
  const response = await route.POST(request(MALFORMED));
  assert.equal(response.status, 400);
  assert.deepEqual(plain(response.body), { ok: false, error: "invalid_payload" });
  assert.deepEqual(calls, []);
});

test("endpoint: an invalid payload never reaches the database", async () => {
  const { route, calls } = loadRoute();
  const response = await route.POST(request({ name: "a", email: "x", projectType: "", message: "" }));
  assert.equal(response.status, 400);
  assert.deepEqual(calls, []);
});

test("endpoint: the honeypot answers like a success and stores nothing", async () => {
  const { route, calls } = loadRoute();
  const response = await route.POST(request({ ...validPayload, website: "http://spam.example" }));
  assert.equal(response.status, 200);
  assert.deepEqual(plain(response.body), { ok: true, stored: false, notified: false });
  assert.deepEqual(calls, []);
});

test("endpoint: the lead is stored before the e-mail is attempted", async () => {
  const { route, calls } = loadRoute();
  const response = await route.POST(request(validPayload));
  assert.equal(response.status, 200);
  assert.deepEqual(plain(response.body), { ok: true, stored: true, notified: true });
  assert.deepEqual(calls, ["store", `notify:${CONTACT_ID}`]);
});

test("endpoint: without the secret key the lead is not stored but the e-mail still goes out", async (t) => {
  const logged = t.mock.method(console, "error", () => {});
  const { route, calls } = loadRoute({ hasKey: false });
  const response = await route.POST(request(validPayload));
  assert.equal(response.status, 200);
  assert.deepEqual(plain(response.body), { ok: true, stored: false, notified: true });
  assert.deepEqual(calls, ["notify:null"]);
  assert.match(logged.mock.calls.at(-1).arguments[0], /SUPABASE_SECRET_KEY/);
});

test("endpoint: a stored lead survives an unavailable e-mail service", async () => {
  const { route } = loadRoute({ notify: () => ({ ok: false, reason: "not_configured" }) });
  const response = await route.POST(request(validPayload));
  assert.equal(response.status, 200);
  assert.deepEqual(plain(response.body), { ok: true, stored: true, notified: false });
});

test("endpoint: only losing both paths fails the request", async (t) => {
  t.mock.method(console, "error", () => {});
  const { route } = loadRoute({ store: () => ({ ok: false, reason: "denied" }), notify: () => ({ ok: false, reason: "failed" }) });
  const response = await route.POST(request(validPayload));
  assert.equal(response.status, 503);
  assert.deepEqual(plain(response.body), { ok: false, error: "unavailable" });
});

test("endpoint: rate limit is per client and lets the sixth request through only later", async () => {
  const { route } = loadRoute();
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.equal((await route.POST(request(validPayload))).status, 200, `tentativa ${attempt}`);
  }
  assert.equal((await route.POST(request(validPayload))).status, 429);
  // Another address is unaffected by the first one's window.
  assert.equal((await route.POST(request(validPayload, "198.51.100.7"))).status, 200);
});

test("endpoint: the client is the last forwarded hop, which a visitor cannot forge", async () => {
  const { route } = loadRoute();
  // A visitor sending their own header cannot escape the bucket: the proxy
  // appends the address it saw, and only that last hop counts.
  const spoofed = (n) => `10.0.0.${n}, 203.0.113.200`;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.equal((await route.POST(request(validPayload, spoofed(attempt)))).status, 200, `tentativa ${attempt}`);
  }
  assert.equal((await route.POST(request(validPayload, spoofed(99)))).status, 429, "trocar o primeiro hop não deve liberar");
  assert.equal((await route.POST(request(validPayload, "10.0.0.1, 203.0.113.201"))).status, 200, "outro proxy, outro balde");
});

test("endpoint: an oversized body is refused before parsing", async (t) => {
  t.mock.method(console, "error", () => {});
  const { route, calls } = loadRoute();

  const declared = await route.POST(request(validPayload, "198.51.100.30", { contentLength: 200_000 }));
  assert.equal(declared.status, 413);
  assert.deepEqual(plain(declared.body), { ok: false, error: "payload_too_large" });

  // Without Content-Length the stream itself has to be measured and cancelled.
  const big = new Uint8Array(40_000);
  big.fill(65);
  const chunked = await route.POST(request(validPayload, "198.51.100.31", { contentLength: null, chunks: [big, big] }));
  assert.equal(chunked.status, 413);
  assert.deepEqual(calls, [], "nada deve chegar ao banco ou ao e-mail");
});

test("endpoint: a body split inside a multi-byte character is reassembled correctly", async () => {
  const { route, calls } = loadRoute();
  const bytes = encoder.encode(JSON.stringify(validPayload));
  // Cut right after the lead byte of an accented character ("Automação"), the
  // case a naive chunk-by-chunk decode turns into mojibake.
  const lead = bytes.findIndex((byte) => byte >= 0xc0);
  assert.ok(lead > 0, "o payload precisa ter um caractere acentuado");
  const chunks = [bytes.slice(0, lead + 1), bytes.slice(lead + 1)];

  const response = await route.POST(request(validPayload, "198.51.100.32", { chunks, contentLength: null }));
  assert.equal(response.status, 200, JSON.stringify(plain(response.body)));
  assert.deepEqual(calls, ["store", `notify:${CONTACT_ID}`]);
});

class Redirect extends Error {
  constructor(url) { super(`redirect:${url}`); this.url = url; }
}

function loadActions({ admin = true, respond = () => ({ data: [{ id: CONTACT_ID }], error: null }) } = {}) {
  const db = fakeDb(respond);
  const actions = loadTs("src/app/admin/(painel)/contatos/actions.ts", {
    mocks: {
      "next/navigation": { redirect: (url) => { throw new Redirect(url); } },
      "@/lib/auth/admin": { requireAdmin: async () => { if (!admin) throw new Redirect("/admin/login"); } },
      "@/lib/supabase/server": { createClient: async () => db }
    }
  });
  return { actions, db };
}
const statusForm = (fields) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
};

test("status action: non-admin is redirected before touching the database", async () => {
  const { actions, db } = loadActions({ admin: false });
  await assert.rejects(
    actions.updateContactStatusAction(statusForm({ id: CONTACT_ID, status: "NEW" })),
    (error) => error.url === "/admin/login"
  );
  assert.equal(db.log.length, 0);
});

test("status action: a tampered id or status never reaches the database", async () => {
  const bad = loadActions();
  await assert.rejects(
    bad.actions.updateContactStatusAction(statusForm({ id: "1 or 1=1", status: "NEW" })),
    (error) => error.url === "/admin/contatos"
  );
  await assert.rejects(
    bad.actions.updateContactStatusAction(statusForm({ id: CONTACT_ID, status: "DELETED" })),
    (error) => error.url === `/admin/contatos/${CONTACT_ID}?erro=status`
  );
  assert.equal(bad.db.log.length, 0);
});

test("status action: success and failure redirect with the right flag", async () => {
  const ok = loadActions();
  await assert.rejects(
    ok.actions.updateContactStatusAction(statusForm({ id: CONTACT_ID, status: "CONVERTED" })),
    (error) => error.url === `/admin/contatos/${CONTACT_ID}?atualizado=1`
  );
  assert.equal(ok.db.log[0], `contacts update({"status":"CONVERTED"}) id=${CONTACT_ID} select(id)`);

  const missing = loadActions({ respond: () => ({ data: [], error: null }) });
  await assert.rejects(
    missing.actions.updateContactStatusAction(statusForm({ id: CONTACT_ID, status: "NEW" })),
    (error) => error.url === `/admin/contatos/${CONTACT_ID}?erro=inexistente`
  );
});
