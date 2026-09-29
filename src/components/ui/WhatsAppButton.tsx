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
 */
export async function WhatsAppButton() {
  const { whatsapp } = await getSiteSettings();
  return (
    <a
      aria-label="Falar pelo WhatsApp"
      href={whatsappLink(whatsapp)}
      target="_blank"
      rel="noreferrer"
      className="focus-ring fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25d366] text-slate-950 shadow-[0_10px_32px_rgba(37,211,102,.28)] transition hover:scale-105 active:scale-100"
    >
      <MessageCircle size={23} aria-hidden="true" />
    </a>
  );
}
