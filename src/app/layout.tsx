import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { siteConfig } from "@/constants/site";
import { getSiteSettings } from "@/lib/repositories/public-settings";

// Institutional metadata follows the settings saved in the admin; the site URL
// stays deployment configuration (NEXT_PUBLIC_SITE_URL).
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${settings.companyName} | Automação, Sistemas, APIs e Dados`,
      template: `%s | ${settings.companyName}`
    },
    description: "Automação de processos, desenvolvimento de sistemas, APIs, integrações, dashboards, dados e inteligência artificial para empresas.",
    keywords: ["automação de processos","desenvolvimento de sistemas","automação empresarial","automação Python","integração de sistemas","desenvolvimento de APIs","consultoria tecnológica","dashboards","Power BI","análise de dados","inteligência artificial para empresas","automação contábil","automação fiscal","Goiânia","Goiás"],
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: siteConfig.url,
      siteName: settings.companyName,
      title: `${settings.companyName} | Tecnologia aplicada a problemas reais`,
      description: settings.description
    },
    twitter: { card: "summary_large_image", title: settings.companyName, description: settings.description },
    robots: { index: true, follow: true }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return <html lang="pt-BR"><body>{children}{gaId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}</Script></> : null}</body></html>;
}
