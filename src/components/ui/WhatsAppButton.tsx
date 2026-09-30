import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";
import { FloatingWhatsApp } from "@/components/ui/FloatingWhatsApp";

/**
 * O verde continua, e é o único verde do site público: aqui ele não é acento da
 * marca, é identificação do canal, do mesmo jeito que o azul do LinkedIn seria.
 * A cor passou de `emerald-500` (#10b981, um verde qualquer) para o verde real
 * do WhatsApp, para que leia como logotipo e não como um terceiro acento solto.
 *
 * A sombra era `shadow-2xl`, preta sobre fundo escuro. Agora é tingida com o
 * próprio verde, que é o que uma peça flutuante projeta de fato.
 *
 * Este componente ficou só com a leitura do número, que é trabalho de servidor.
 * A aparência e a regra de quando aparecer estão em <FloatingWhatsApp/>, que
 * precisa ser componente de cliente para observar a saída do Hero.
 */
export async function WhatsAppButton() {
  const { whatsapp } = await getSiteSettings();
  return <FloatingWhatsApp href={whatsappLink(whatsapp)} />;
}
