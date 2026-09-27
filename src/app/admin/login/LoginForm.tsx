"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { login, type LoginState } from "../actions";

const initialState: LoginState = { error: null, email: "" };
const inputClass = "focus-ring w-full rounded-xl border border-white/10 bg-black/15 px-4 py-3.5 outline-none";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);
  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2 text-sm font-bold text-slate-300">
        E-mail
        <input type="email" name="email" required autoComplete="username" defaultValue={state.email} className={inputClass} />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-300">
        Senha
        <input type="password" name="password" required autoComplete="current-password" className={inputClass} />
      </label>
      {/* Weight on the wrapper: globals.css `font: inherit` overrides it on buttons. */}
      <div className="mt-2 grid font-bold">
        <button disabled={pending} className="focus-ring inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 hover:bg-blue-500 disabled:opacity-60">
          {pending ? "Entrando..." : "Entrar"}
          <LogIn size={17} />
        </button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-red-300">{state.error}</p>
    </form>
  );
}
