export const DEFAULT_WHATSAPP_MESSAGE =
  "Olá, JHConsulting! Gostaria de conhecer as soluções para melhorar os processos e a gestão da minha empresa.";

/**
 * wa.me link from a stored number (any formatting). Without a number, points to
 * the contact section, preserving the original behaviour of whatsappHref().
 */
export function whatsappLink(whatsapp: string | null | undefined, message: string = DEFAULT_WHATSAPP_MESSAGE) {
  const phone = (whatsapp ?? "").replace(/\D/g, "");
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#contato";
}
