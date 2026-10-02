"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/constants/site";

/**
 * Cabeçalho fixo: marca à esquerda, navegação à direita.
 *
 * O botão "Solicitar orçamento" saiu daqui. Ele apontava para o WhatsApp e ficava
 * a poucos pixels do CTA principal do Hero, que tem o mesmo rótulo e o mesmo
 * destino: dois botões de orçamento na mesma dobra fazem o visitante comparar
 * alvos em vez de clicar num deles. O acesso não se perdeu — continua no Hero, na
 * chamada principal, na página de cada projeto e no botão flutuante.
 *
 * Com ele fora, o prop `whatsappUrl` ficou sem uso e saiu também, junto com o
 * `whatsappLink()` que cada página calculava só para preenchê-lo. Prop que não
 * alimenta nada é configuração morta.
 *
 * A altura caiu de 80px para 64px (`h-20` → `h-16`), com `--nav-h` acompanhando em
 * globals.css: quem depende do valor é o recuo de rolagem das âncoras e a altura
 * máxima do menu mobile, e os dois leem o token.
 *
 * Client component por causa do menu mobile. Em páginas internas (/projetos) as
 * âncoras precisam voltar para a home, então #inicio vira /#inicio e a marca
 * aponta para /.
 */
export function Navbar({ internal = false }: { internal?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const to = (href: string) => (internal ? `/${href}` : href);

  /*
   * Menu aberto: ESC fecha e o corpo para de rolar.
   *
   * Com sete itens o painel cobre a maior parte da tela de um telefone, então ele
   * se comporta como camada: enquanto está aberto, rolar move o conteúdo atrás
   * dele, o que dá a impressão de que o toque errou o alvo. E ESC é o que
   * qualquer pessoa que navega por teclado tenta primeiro — antes só havia o
   * botão de fechar e os próprios links.
   *
   * O bloqueio de rolagem não desloca o layout: a barra de rolagem só ocupa
   * largura em ponteiro fino, e este painel existe apenas abaixo de `lg`.
   *
   * O efeito só monta quando `open` é verdadeiro, e a limpeza devolve o
   * `overflow` ao valor anterior — inclusive se o componente desmontar aberto.
   */
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-midnight/90 backdrop-blur-xl">
      {/* `gap-6` entre marca e navegação: sem ele, em `lg` exato (container de
        * 960px) as duas pontas podem encostar uma na outra, porque
        * `justify-between` distribui a sobra e não garante mínimo nenhum. */}
      <div className="container-shell flex h-16 items-center justify-between gap-6">
        <a href={internal ? "/" : "#inicio"} className="focus-ring text-lg font-black tracking-tight">JH<span className="text-blue-400">Consulting</span></a>
        {/* Os sete itens ganharam ar: `gap-6` virou `gap-7`, e `gap-9` a partir de
          * `xl`, onde o container para de crescer e a sobra iria toda para o meio
          * da barra. Somados, rótulos e vãos medem cerca de 530px em `lg` (960px
          * de container) e 570px em `xl` — folga confortável em ambos. */}
        <nav className="hidden items-center gap-7 lg:flex xl:gap-9" aria-label="Navegação principal">
          {siteConfig.nav.map(([label, href]) => <a key={href} href={to(href)} className="focus-ring text-sm text-slate-300 transition hover:text-white">{label}</a>)}
        </nav>
        {/* `p-2.5` com ícone de 24px dá 44px de área de toque, o mínimo
          * recomendado para alvo de dedo. Em `p-2` eram 40px. Cabe nos 64px da
          * barra sem forçar a altura dela. */}
        <button ref={menuButtonRef} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open} onClick={() => setOpen(v => !v)} className="focus-ring rounded-full p-2.5 lg:hidden">{open ? <X /> : <Menu />}</button>
      </div>
      {open ? (
        /* A altura máxima é o que sobra da viewport abaixo do cabeçalho, com
         * rolagem própria: em tela baixa (telefone na horizontal) sete itens
         * passavam da altura disponível e os últimos ficavam fora de alcance.
         * `dvh` acompanha a barra do navegador móvel ao aparecer, e `--nav-h`
         * vem de globals.css, que é onde a altura do cabeçalho é definida. */
        <div className="container-shell max-h-[calc(100dvh-var(--nav-h))] overflow-y-auto border-t border-white/5 py-4 lg:hidden">
          <nav className="grid gap-2" aria-label="Navegação mobile">
            {siteConfig.nav.map(([label, href]) => <a key={href} href={to(href)} onClick={() => setOpen(false)} className="focus-ring rounded-xl px-3 py-3 text-slate-200 hover:bg-white/5">{label}</a>)}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
