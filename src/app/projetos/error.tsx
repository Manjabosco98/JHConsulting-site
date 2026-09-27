"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ProjetosError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="section-space">
      <div className="container-shell max-w-2xl text-center">
        <h1 className="section-title">Não foi possível carregar os projetos.</h1>
        <p className="section-copy mx-auto">Tente novamente em instantes. Se o problema continuar, volte para a página inicial.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-bold">
          <button onClick={reset} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 hover:bg-blue-500">
            Tentar novamente <RotateCcw size={15} aria-hidden="true" />
          </button>
          <Link href="/" className="focus-ring inline-flex items-center rounded-xl border border-white/10 px-4 py-2.5 text-slate-200 hover:bg-white/5">Página inicial</Link>
        </div>
      </div>
    </main>
  );
}
