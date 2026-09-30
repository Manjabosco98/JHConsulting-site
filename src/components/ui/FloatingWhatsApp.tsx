"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

/**
 * O botão flutuante só aparece depois que o Hero sai da tela.
 *
 * Medido em 320x568: com a viewport baixa, os dois botões do Hero caem na faixa
 * inferior da tela e o botão flutuante, de 52px no canto, ficava exatamente em
 * cima deles. Quem tocasse ali abria o WhatsApp em vez de "Solicitar orçamento"
 * ou "Conhecer soluções" — as duas ações principais da página, bloqueadas pelo
 * atalho para uma terceira. Em 390px e acima a colisão não acontece, e foi por
 * isso que a primeira rodada não a encontrou: só aparece na tela mais baixa.
 *
 * Esconder enquanto o Hero está visível resolve a colisão e, de graça, tira o
 * botão de cima da fotografia do Hero, que era outra queixa.
 *
 * `IntersectionObserver` e não escuta de rolagem: a observação é feita pelo
 * navegador, sem rodar código a cada quadro de scroll.
 *
 * O estado inicial é visível, que é o que o HTML do servidor entrega. Assim o
 * botão continua funcionando sem JavaScript, e o efeito só o esconde depois de
 * montar. Nas páginas internas (/projetos e /projetos/[slug]) não existe `#inicio`,
 * então o observador não é criado e o botão fica visível desde o começo, que é o
 * comportamento correto ali: não há Hero para conflitar.
 */
export function FloatingWhatsApp({ href }: { href: string }) {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    if (!hero) return;
    // `threshold: 0` mantém a regra simples e previsível: qualquer pedaço do
    // Hero à vista esconde o botão. Um limite proporcional dependeria da altura
    // do Hero caber na viewport, o que não é verdade em tela baixa.
    const observer = new IntersectionObserver(([entry]) => setOculto(entry.isIntersecting));
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <a
      aria-label="Falar pelo WhatsApp"
      href={href}
      target="_blank"
      rel="noreferrer"
      // Escondido também para o leitor de tela e fora da ordem de tabulação
      // enquanto está invisível: um alvo transparente que recebe foco é pior do
      // que um alvo que não existe.
      aria-hidden={oculto}
      tabIndex={oculto ? -1 : undefined}
      style={{
        // Em `style` porque combina unidade fixa com `env()`, que não existe na
        // escala do Tailwind. A faixa inferior da tela é área do navegador em
        // iOS Safari e no Chrome Android.
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        right: "calc(1rem + env(safe-area-inset-right, 0px))"
      }}
      className={`focus-ring fixed z-40 grid h-13 w-13 place-items-center rounded-full bg-[#25d366] text-slate-950 shadow-[0_10px_32px_rgba(37,211,102,.28)] transition hover:scale-105 active:scale-100 sm:h-14 sm:w-14 ${
        oculto ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <MessageCircle size={23} aria-hidden="true" />
    </a>
  );
}
