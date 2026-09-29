"use client";

import { Trash2 } from "lucide-react";
import { deleteTechnologyAction, deleteTechnologyGroupAction } from "@/app/admin/(painel)/tecnologias/actions";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

const buttonClass = "focus-ring inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-red-200 hover:bg-red-500/10";

export function DeleteTechnologyForm({ id, name, groups }: { id: string; name: string; groups: number }) {
  return (
    <form action={deleteTechnologyAction} data-form="delete-technology" className="text-sm font-bold">
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        question={`Excluir definitivamente "${name}"?`}
        detail={groups
          ? `Ela será removida de ${groups} grupo(s). Projetos que ainda a usam impedem a exclusão.`
          : "Projetos que ainda a usam impedem a exclusão."}
        confirmLabel="Excluir tecnologia"
        className={buttonClass}
      >
        Excluir tecnologia <Trash2 size={15} aria-hidden="true" />
      </ConfirmButton>
    </form>
  );
}

export function DeleteTechnologyGroupForm({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteTechnologyGroupAction} data-form="delete-group" className="text-sm font-bold">
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        question={`Excluir o grupo "${name}"?`}
        detail="As tecnologias continuam cadastradas, apenas deixam de ser agrupadas aqui."
        confirmLabel="Excluir grupo"
        className={buttonClass}
      >
        Excluir grupo <Trash2 size={15} aria-hidden="true" />
      </ConfirmButton>
    </form>
  );
}
