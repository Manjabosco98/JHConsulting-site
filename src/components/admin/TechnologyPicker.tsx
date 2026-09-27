"use client";

import { ArrowDown, ArrowUp, X } from "lucide-react";

export type TechnologyOption = { id: string; name: string; active: boolean };

type Props = {
  options: TechnologyOption[];
  /** Selected ids, in display order. */
  value: string[];
  onChange: (ids: string[]) => void;
  orderLabel: string;
  emptyText: string;
  error?: string;
};

/**
 * Chip toggles plus an ordered list; the order is submitted as repeated
 * technology_ids inputs, which the server turns into display_order.
 * Shared by the project and technology-group forms.
 */
export function TechnologyPicker({ options, value, onChange, orderLabel, emptyText, error }: Props) {
  const nameOf = new Map(options.map((option) => [option.id, option.name]));

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((current) => current !== id) : [...value, id]);
  const move = (index: number, offset: number) => {
    const next = [...value];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Tecnologias disponíveis">
        {options.map((option) => {
          const checked = value.includes(option.id);
          return (
            <label key={option.id} className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-xs font-bold focus-within:ring-2 focus-within:ring-blue-400 ${
              checked ? "border-blue-400/50 bg-blue-500/15 text-blue-100" : "border-white/10 text-slate-400 hover:text-slate-200"}`}>
              <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggle(option.id)} />
              {option.name}{option.active ? "" : " (inativa)"}
            </label>
          );
        })}
      </div>
      {value.length ? (
        <div>
          <p className="text-sm font-bold text-slate-300">{orderLabel}</p>
          <ol className="mt-2 grid gap-1.5 sm:max-w-md">
            {value.map((id, index) => (
              <li key={id} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-sm">
                <span className="w-5 text-slate-500">{index + 1}.</span>
                <span className="mr-auto">{nameOf.get(id) ?? "Tecnologia removida"}</span>
                <button type="button" aria-label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)} className="focus-ring rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"><ArrowUp size={14} /></button>
                <button type="button" aria-label="Mover para baixo" disabled={index === value.length - 1} onClick={() => move(index, 1)} className="focus-ring rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"><ArrowDown size={14} /></button>
                <button type="button" aria-label="Remover" onClick={() => toggle(id)} className="focus-ring rounded p-1 text-slate-400 hover:text-red-300"><X size={14} /></button>
                <input type="hidden" name="technology_ids" value={id} />
              </li>
            ))}
          </ol>
        </div>
      ) : <p className="text-sm text-slate-500">{emptyText}</p>}
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </>
  );
}
