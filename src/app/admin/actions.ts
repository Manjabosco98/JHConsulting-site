"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_HOME_PATH, ADMIN_LOGIN_PATH } from "@/lib/auth/admin-routes";

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(256)
});

export type LoginState = { error: string | null; email: string };

export async function login(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "").slice(0, 254);
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  if (!parsed.success) return { error: "Informe um e-mail e uma senha válidos.", email: rawEmail };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Generic message: never reveal whether the e-mail exists.
    const message = error.status === 429
      ? "Muitas tentativas. Aguarde alguns minutos e tente novamente."
      : "E-mail ou senha incorretos.";
    return { error: message, email: parsed.data.email };
  }

  const { data: isAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (rpcError || isAdmin !== true) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "Esta conta não tem acesso ao painel.", email: parsed.data.email };
  }

  redirect(ADMIN_HOME_PATH);
}

export async function logout() {
  const supabase = await createClient();
  // "global" revokes the refresh tokens on the server, not just the cookies:
  // a token captured before logout stops being renewable. The access token
  // already issued still lives until it expires — that is how JWTs work, and
  // shortening it is a setting in Supabase Auth.
  await supabase.auth.signOut({ scope: "global" });
  redirect(ADMIN_LOGIN_PATH);
}
