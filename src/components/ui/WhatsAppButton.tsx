import { MessageCircle } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";

export async function WhatsAppButton() {
  const { whatsapp } = await getSiteSettings();
  return (
    <a
      aria-label="Falar pelo WhatsApp"
      href={whatsappLink(whatsapp)}
      target="_blank"
      rel="noreferrer"
      className="focus-ring fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-emerald-500 text-slate-950 shadow-2xl transition hover:scale-105"
    >
      <MessageCircle size={23} />
    </a>
  );
}
