"use client";

import { Trash2 } from "lucide-react";
import { deleteServiceAction } from "@/app/admin/(painel)/servicos/actions";

export function DeleteServiceForm({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteServiceAction}
      data-form="delete-service"
      className="text-sm font-bold"
      onSubmit={(event) => {
        if (!window.confirm(`Excluir definitivamente "${title}"? Para apenas tirar do site, desmarque "Ativo".`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="focus-ring inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-red-200 hover:bg-red-500/10">
        Excluir serviço <Trash2 size={15} aria-hidden="true" />
      </button>
    </form>
  );
}
