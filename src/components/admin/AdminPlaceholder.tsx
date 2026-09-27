import { Construction } from "lucide-react";
import { AdminPageHeader } from "./AdminPageHeader";

type Props = { title: string; description: string; phase: number };

/** Temporary section page until its CRUD phase is implemented. */
export function AdminPlaceholder({ title, description, phase }: Props) {
  return (
    <div className="grid gap-8">
      <AdminPageHeader title={title} description={description} />
      <div className="card flex items-center gap-4 rounded-2xl p-6 text-sm text-slate-400">
        <Construction size={20} className="shrink-0 text-amber-300" aria-hidden="true" />
        <p>Gerenciamento em construção (Fase {phase}).</p>
      </div>
    </div>
  );
}
