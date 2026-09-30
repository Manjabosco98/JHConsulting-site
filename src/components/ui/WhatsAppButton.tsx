import { MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * O verde continua, e é o único verde do site público: aqui ele não é acento da
 * marca, é identificação do canal, do mesmo jeito que o azul do LinkedIn seria.
 * A cor passou de `emerald-500` (#10b981, um verde qualquer) para o verde real
 * do WhatsApp, para que leia como logotipo e não como um terceiro acento solto.
 *
 * A sombra era `shadow-2xl`, preta sobre fundo escuro. Agora é tingida com o
 * próprio verde, que é o que uma peça flutuante projeta de fato.
 *
 * ── Posicionamento ───────────────────────────────────────────────────────────
 *
 * `bottom-5 right-5` fixo tinha dois problemas no telefone. O primeiro é a
 * barra do navegador: em iOS Safari e no Chrome Android a faixa inferior da tela
 * é área do navegador, e 20px de folga colocavam o botão parcialmente embaixo
 * dela. `env(safe-area-inset-bottom)` é o valor que o próprio sistema informa
 * para essa faixa; somado à folga base, o botão fica acima dela em qualquer
 * aparelho, sem media query por modelo.
 *
 * O segundo é sobreposição: 56px no canto inferior direito caem sobre o canto da
 * foto do Hero e sobre a borda direita do botão de envio do formulário. O
 * diâmetro caiu para 52px no mobile (ainda acima dos 44px mínimos de área de
 * toque) e a folga lateral subiu de 20px para 16px+safe-area, o que tira o botão
 * de cima do conteúdo sem mudar o que ele é.
 *
 * `z-40` fica abaixo do `z-50` da navbar de propósito: ao rolar, o cabeçalho
 * passa por cima, não o contrário.
 */
export async function WhatsAppButton() {
  const { whatsapp } = await getSiteSettings();
  return (
    <a
      aria-label="Falar pelo WhatsApp"
      href={whatsappLink(whatsapp)}
      target="_blank"
      rel="noreferrer"
      style={{
        // Em `style` porque o valor combina uma unidade fixa com `env()`, que
        // não existe na escala do Tailwind.
        bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))",
        right: "calc(1rem + env(safe-area-inset-right, 0px))"
      }}
      className="focus-ring fixed z-40 grid h-13 w-13 place-items-center rounded-full bg-[#25d366] text-slate-950 shadow-[0_10px_32px_rgba(37,211,102,.28)] transition hover:scale-105 active:scale-100 sm:h-14 sm:w-14"
    >
      <MessageCircle size={23} aria-hidden="true" />
    </a>
  );
}
