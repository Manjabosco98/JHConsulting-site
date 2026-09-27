"use client";

import { Trash2 } from "lucide-react";
import { deleteProjectAction } from "@/app/admin/(painel)/projetos/actions";

export function DeleteProjectForm({ id, title }: { id: string; title: string }) {
  return (
    <form
      action={deleteProjectAction}
      data-form="delete-project"
      className="text-sm font-bold"
      onSubmit={(event) => {
        if (!window.confirm(`Excluir definitivamente "${title}"? Para apenas tirar do site, use "Arquivado".`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="focus-ring inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-red-200 hover:bg-red-500/10">
        Excluir projeto <Trash2 size={15} aria-hidden="true" />
      </button>
    </form>
  );
}
