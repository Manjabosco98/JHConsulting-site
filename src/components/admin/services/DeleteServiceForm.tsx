"use client";

import { Trash2 } from "lucide-react";
import { deleteServiceAction } from "@/app/admin/(painel)/servicos/actions";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

export function DeleteServiceForm({ id, title }: { id: string; title: string }) {
  return (
    <form action={deleteServiceAction} data-form="delete-service" className="text-sm font-bold">
      <input type="hidden" name="id" value={id} />
      <ConfirmButton
        question={`Excluir definitivamente "${title}"?`}
        detail='A exclusão é permanente. Para apenas tirar do site, desmarque "Ativo".'
        confirmLabel="Excluir serviço"
        className="focus-ring inline-flex items-center gap-2 rounded-xl border border-red-400/30 px-4 py-2.5 text-red-200 hover:bg-red-500/10"
      >
        Excluir serviço <Trash2 size={15} aria-hidden="true" />
      </ConfirmButton>
    </form>
  );
}
