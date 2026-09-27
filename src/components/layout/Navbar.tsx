"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { siteConfig, whatsappHref } from "@/constants/site";

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080d18]/78 backdrop-blur-xl">
      <div className="container-shell flex h-20 items-center justify-between">
        <a href="#inicio" className="focus-ring text-lg font-black tracking-tight">JH<span className="text-blue-400">Consulting</span></a>
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navegação principal">
          {siteConfig.nav.map(([label, href]) => <a key={href} href={href} className="focus-ring text-sm text-slate-300 transition hover:text-white">{label}</a>)}
        </nav>
        <a href={whatsappHref()} target="_blank" rel="noreferrer" className="focus-ring hidden rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold transition hover:bg-blue-500 md:inline-flex">Solicitar orçamento</a>
        <button aria-label="Abrir menu" aria-expanded={open} onClick={() => setOpen(v => !v)} className="focus-ring rounded-lg p-2 lg:hidden">{open ? <X /> : <Menu />}</button>
      </div>
      {open ? (
        <div className="container-shell border-t border-white/5 py-4 lg:hidden">
          <nav className="grid gap-2" aria-label="Navegação mobile">
            {siteConfig.nav.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-slate-200 hover:bg-white/5">{label}</a>)}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
