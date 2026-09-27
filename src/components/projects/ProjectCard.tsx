import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export type ProjectCardData = {
  title: string;
  category: string;
  problem: string;
  solution: string;
  status: string;
  technologies: readonly string[];
  href: string | null;
};

/** Portfolio card, preserving the original home markup. Clickable when href is set. */
export function ProjectCard({ project }: { project: ProjectCardData }) {
  const inner = (
    <>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-blue-300">{project.category}</p>
          <h3 className="mt-3 text-xl font-black">{project.title}</h3>
        </div>
        <ArrowUpRight className="shrink-0 text-slate-500 transition-colors group-hover:text-blue-300" />
      </div>
      <div className="mt-6 space-y-4 text-sm leading-6">
        <div>
          <p className="font-bold text-slate-200">Problema</p>
          <p className="mt-1 text-slate-400">{project.problem}</p>
        </div>
        <div>
          <p className="font-bold text-slate-200">Solução</p>
          <p className="mt-1 text-slate-400">{project.solution}</p>
        </div>
      </div>
      {project.technologies.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {project.technologies.map((tech) => (
            <span key={tech} className="rounded-full border border-white/8 px-2.5 py-1 text-xs text-slate-400">{tech}</span>
          ))}
        </div>
      ) : null}
      {project.status ? <p className="mt-6 text-xs font-bold text-emerald-300">{project.status}</p> : null}
    </>
  );

  if (project.href) {
    return (
      <Link href={project.href} className="focus-ring group card block rounded-3xl p-6 transition-colors hover:border-blue-400/30">
        {inner}
      </Link>
    );
  }
  return <article className="group card rounded-3xl p-6">{inner}</article>;
}
