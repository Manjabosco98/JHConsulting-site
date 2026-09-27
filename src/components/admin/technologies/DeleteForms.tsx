"use client";

import { Trash2 } from "lucide-react";
import { deleteTechnologyAction, deleteTechnologyGroupAction } from "@/app/admin/(painel)/tecnologias/actions";

const buttonClass = "focus-ring inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-red-200 hover:bg-red-500/10";

export function DeleteTechnologyForm({ id, name, groups }: { id: string; name: string; groups: number }) {
  const warning = groups
    ? `Excluir "${name}"? Ela será removida de ${groups} grupo(s).`
    : `Excluir definitivamente "${name}"?`;
  return (
    <form
      action={deleteTechnologyAction}
      data-form="delete-technology"
      className="text-sm font-bold"
      onSubmit={(event) => { if (!window.confirm(warning)) event.preventDefault(); }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={buttonClass}>Excluir tecnologia <Trash2 size={15} aria-hidden="true" /></button>
    </form>
  );
}

export function DeleteTechnologyGroupForm({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteTechnologyGroupAction}
      data-form="delete-group"
      className="text-sm font-bold"
      onSubmit={(event) => {
        if (!window.confirm(`Excluir o grupo "${name}"? As tecnologias continuam cadastradas.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className={buttonClass}>Excluir grupo <Trash2 size={15} aria-hidden="true" /></button>
    </form>
  );
}
