import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthState } from "@/lib/auth/admin";
import { ADMIN_HOME_PATH } from "@/lib/auth/admin-routes";
import { logout } from "../actions";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Entrar" };

export default async function AdminLoginPage() {
  const state = await getAuthState();
  if (state.status === "admin") redirect(ADMIN_HOME_PATH);

  return (
    <main className="grid min-h-screen place-items-center px-4 py-16">
      <div className="card w-full max-w-md rounded-3xl p-6 sm:p-8">
        <p className="section-kicker">Painel administrativo</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">JHConsulting</h1>
        {state.status === "forbidden" ? (
          <div className="mt-6 grid gap-4">
            <p className="text-sm leading-6 text-slate-300">
              A conta <strong>{state.email ?? "atual"}</strong> não tem acesso ao painel.
            </p>
            <form action={logout}>
              <button className="focus-ring w-full rounded-xl border border-white/10 px-5 py-3.5 font-bold hover:bg-white/5">
                Sair e entrar com outra conta
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-6">
            <LoginForm />
          </div>
        )}
      </div>
    </main>
  );
}
