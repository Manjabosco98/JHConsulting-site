import { NextResponse } from "next/server";
import { parseContactPayload, toContactRow, type ContactPayload } from "@/lib/validation/contact";
import { createSecretClient, hasSupabaseSecretKey } from "@/lib/supabase/secret";
import { storeContact } from "@/lib/repositories/contacts";
import { notifyNewContact } from "@/lib/contact/notify";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
/** Sweeping at this size keeps the map bounded without a timer. */
const MAX_TRACKED_CLIENTS = 5_000;
/** A valid submission is under 5 KB; the rest is abuse or a mistake. */
const MAX_BODY_BYTES = 64 * 1024;

const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * The nearest proxy appends the address it actually observed, so the **last**
 * entry is the one a client cannot forge — the first one is entirely
 * client-controlled. Without a proxy in front there is nothing trustworthy in
 * this header at all, which is why the limit below is a speed bump against
 * casual abuse and never an access control.
 */
function clientKey(request: Request) {
  const hops = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops.at(-1) ?? "unknown";
}

/**
 * Reads the body with a hard ceiling. Checking Content-Length alone would let a
 * chunked request through, so the stream itself is measured and cancelled.
 */
async function readLimitedText(request: Request, limit: number): Promise<string | null> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return null;

  const reader = request.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function limited(ip: string) {
  const now = Date.now();
  if (buckets.size >= MAX_TRACKED_CLIENTS) {
    for (const [key, bucket] of buckets) if (bucket.resetAt < now) buckets.delete(key);
  }
  const current = buckets.get(ip);
  if (!current || current.resetAt < now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_PER_WINDOW;
}

type Stored = { ok: true; id: string } | { ok: false };

/** Persists the lead. Any failure is logged and reported, never thrown. */
async function store(payload: ContactPayload): Promise<Stored> {
  if (!hasSupabaseSecretKey()) {
    console.error("[contact] SUPABASE_SECRET_KEY ausente: o lead não foi gravado.");
    return { ok: false };
  }
  try {
    const result = await storeContact(createSecretClient(), toContactRow(payload));
    return result.ok ? result : { ok: false };
  } catch (error) {
    console.error(`[contact] gravação falhou: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    return { ok: false };
  }
}

/**
 * Public contact endpoint. The lead is stored first and the e-mail is only a
 * notification, so a Resend outage does not lose a lead — and vice versa. The
 * request only fails when *both* paths fail, which is the one case where the
 * visitor must be told to use another channel.
 */
export async function POST(request: Request) {
  if (limited(clientKey(request))) {
    return NextResponse.json({ ok: false, error: "rate_limit" }, { status: 429 });
  }

  const raw = await readLimitedText(request, MAX_BODY_BYTES);
  if (raw === null) {
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    // Malformed JSON is a client error; it used to surface as a 500.
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const parsed = parseContactPayload(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }
  // Honeypot filled: answer like a success and store nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true, stored: false, notified: false });
  }

  const stored = await store(parsed.data);
  const notified = await notifyNewContact(parsed.data, stored.ok ? stored.id : null);

  if (!stored.ok && !notified.ok) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, stored: stored.ok, notified: notified.ok });
}
