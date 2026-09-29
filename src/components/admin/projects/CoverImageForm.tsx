"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import type { CoverFormState } from "@/app/admin/(painel)/projetos/actions";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/storage/images";
import { ConfirmButton } from "@/components/ui/ConfirmButton";

type Props = {
  action: (state: CoverFormState, formData: FormData) => Promise<CoverFormState>;
  currentUrl: string | null;
  title: string;
};

const initialState: CoverFormState = { status: "idle", message: null };

export function CoverImageForm({ action, currentUrl, title }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  // A selection belongs to the state it was made in: once the action answers
  // (new state object), the preview disappears and the saved cover shows.
  const [selection, setSelection] = useState<{ url: string; tooBig: boolean; state: CoverFormState } | null>(null);
  const preview = selection?.state === state ? selection : null;
  const shownUrl = preview?.url ?? currentUrl;

  return (
    <form action={formAction} data-form="cover" className="card grid gap-5 rounded-2xl p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="relative aspect-[1200/630] overflow-hidden rounded-xl border border-white/10 bg-black/20">
        {shownUrl ? (
          <Image src={shownUrl} alt={`Capa de ${title}`} fill sizes="(min-width: 768px) 40vw, 100vw"
            className="object-cover" unoptimized={Boolean(preview)} />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-500">
            <span className="flex items-center gap-2"><ImagePlus size={18} aria-hidden="true" /> Sem capa</span>
          </div>
        )}
      </div>

      <div className="grid content-start gap-4">
        <div>
          <h2 className="font-black">Capa do projeto</h2>
          <p className="mt-1 text-sm text-slate-400">JPEG, PNG, WebP ou AVIF, até 5 MB. Proporção recomendada 1200×630 px (também usada no compartilhamento).</p>
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-300">
          Arquivo
          <input
            type="file"
            name="cover"
            accept={ACCEPTED_IMAGE_TYPES}
            className="focus-ring rounded-xl border border-white/10 bg-black/15 p-2 text-sm font-normal text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-slate-200"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (selection) URL.revokeObjectURL(selection.url);
              setSelection(file ? { url: URL.createObjectURL(file), tooBig: file.size > MAX_IMAGE_BYTES, state } : null);
            }}
          />
        </label>
        {preview?.tooBig ? <p className="text-sm text-red-300">A imagem deve ter no máximo 5 MB.</p> : null}
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          <button name="intent" value="upload" disabled={pending || !preview || preview.tooBig}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 hover:bg-blue-500 disabled:opacity-50">
            <Upload size={15} aria-hidden="true" /> {pending ? "Enviando..." : "Enviar capa"}
          </button>
          {currentUrl ? (
            <ConfirmButton
              name="intent"
              value="remove"
              disabled={pending}
              question="Remover a capa deste projeto?"
              detail="A imagem é apagada do armazenamento. Você pode enviar outra quando quiser."
              confirmLabel="Remover capa"
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-slate-200 hover:bg-white/5 disabled:opacity-50"
            >
              <Trash2 size={15} aria-hidden="true" /> Remover capa
            </ConfirmButton>
          ) : null}
        </div>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {pending ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
