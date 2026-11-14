"use client";

import { RotateCcw } from "lucide-react";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card rounded-2xl p-6">
      <h1 className="text-xl font-black">Não foi possível carregar esta página.</h1>
      <p className="mt-2 text-sm leading-7 text-slate-300">Verifique a conexão e tente novamente. Seus dados salvos continuam preservados.</p>
      <div className="mt-5 text-sm font-bold">
        <button onClick={reset} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 hover:bg-blue-500">
          Tentar novamente <RotateCcw size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
