"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import type { PhotoFormState } from "@/app/admin/(painel)/configuracoes/actions";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/storage/images";

type Props = {
  action: (state: PhotoFormState, formData: FormData) => Promise<PhotoFormState>;
  currentUrl: string | null;
  professionalName: string;
};

const initialState: PhotoFormState = { status: "idle", message: null };

export function ProfilePhotoForm({ action, currentUrl, professionalName }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState);
  // The preview belongs to the state it was chosen in: once the action answers,
  // the saved photo takes over.
  const [selection, setSelection] = useState<{ url: string; tooBig: boolean; state: PhotoFormState } | null>(null);
  const preview = selection?.state === state ? selection : null;
  const shownUrl = preview?.url ?? currentUrl;

  return (
    <form action={formAction} data-form="photo" className="card grid gap-5 rounded-2xl p-5 sm:p-6 md:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-black/20">
        {shownUrl ? (
          <Image src={shownUrl} alt={`Foto de ${professionalName}`} fill sizes="240px" className="object-cover" unoptimized={Boolean(preview)} />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-500">
            <span className="flex items-center gap-2"><ImagePlus size={18} aria-hidden="true" /> Sem foto</span>
          </div>
        )}
      </div>

      <div className="grid content-start gap-4">
        <div>
          <h2 className="font-black">Foto profissional</h2>
          <p className="mt-1 text-sm text-slate-400">Aparece na seção Sobre. JPEG, PNG, WebP ou AVIF, até 5 MB. Proporção recomendada 3:4 (retrato).</p>
        </div>
        <label className="grid gap-2 text-sm font-bold text-slate-300">
          Arquivo
          <input
            type="file"
            name="photo"
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
            <Upload size={15} aria-hidden="true" /> {pending ? "Enviando..." : "Enviar foto"}
          </button>
          {currentUrl ? (
            <button name="intent" value="remove" disabled={pending}
              onClick={(event) => { if (!window.confirm("Remover a foto profissional?")) event.preventDefault(); }}
              className="focus-ring inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-slate-200 hover:bg-white/5 disabled:opacity-50">
              <Trash2 size={15} aria-hidden="true" /> Remover foto
            </button>
          ) : null}
        </div>
        <p aria-live="polite" className={`text-sm ${state.status === "error" ? "text-red-300" : "text-emerald-300"}`}>
          {pending ? "" : state.message}
        </p>
      </div>
    </form>
  );
}
