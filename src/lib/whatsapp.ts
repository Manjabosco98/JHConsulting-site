export const DEFAULT_WHATSAPP_MESSAGE =
  "Olá João, encontrei seu site da JHConsulting e gostaria de conversar sobre um projeto.";

/**
 * wa.me link from a stored number (any formatting). Without a number, points to
 * the contact section, preserving the original behaviour of whatsappHref().
 */
export function whatsappLink(whatsapp: string | null | undefined, message: string = DEFAULT_WHATSAPP_MESSAGE) {
  const phone = (whatsapp ?? "").replace(/\D/g, "");
  return phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : "#contato";
}
