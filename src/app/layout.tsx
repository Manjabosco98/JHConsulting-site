import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { siteConfig } from "@/constants/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "JHConsulting | Automação, Sistemas, APIs e Dados", template: "%s | JHConsulting" },
  description: "Automação de processos, desenvolvimento de sistemas, APIs, integrações, dashboards, dados e inteligência artificial para empresas.",
  keywords: ["automação de processos","desenvolvimento de sistemas","automação empresarial","automação Python","integração de sistemas","desenvolvimento de APIs","consultoria tecnológica","dashboards","Power BI","análise de dados","inteligência artificial para empresas","automação contábil","automação fiscal","Goiânia","Goiás"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "pt_BR", url: siteConfig.url, siteName: siteConfig.name, title: "JHConsulting | Tecnologia aplicada a problemas reais", description: siteConfig.description },
  twitter: { card: "summary_large_image", title: "JHConsulting", description: siteConfig.description },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return <html lang="pt-BR"><body>{children}{gaId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}</Script></> : null}</body></html>;
}
