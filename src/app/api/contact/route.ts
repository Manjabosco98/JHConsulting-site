import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(100),
  company: z.string().max(120).optional().default(""),
  email: z.string().email().max(160),
  whatsapp: z.string().max(40).optional().default(""),
  projectType: z.string().min(2).max(80),
  message: z.string().min(20).max(4000),
  website: z.string().optional().default("")
});

const buckets = new Map<string, { count: number; resetAt: number }>();
function limited(ip: string) {
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || current.resetAt < now) { buckets.set(ip, { count: 1, resetAt: now + 60_000 }); return false; }
  current.count += 1;
  return current.count > 5;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "rate_limit" }, { status: 429 });

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  if (parsed.data.website) return NextResponse.json({ ok: true });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !to || !from) return NextResponse.json({ ok: false, error: "email_not_configured" }, { status: 503 });

  const resend = new Resend(apiKey);
  const { name, company, email, whatsapp, projectType, message } = parsed.data;
  const result = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Novo lead JHConsulting — ${projectType}`,
    text: [`Nome: ${name}`, `Empresa: ${company || "-"}`, `Email: ${email}`, `WhatsApp: ${whatsapp || "-"}`, `Tipo: ${projectType}`, "", message].join("\n")
  });

  if (result.error) return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
