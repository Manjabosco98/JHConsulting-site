import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/constants/site";
import { getSiteSettings } from "@/lib/repositories/public-settings";

// Official families are self-hosted by next/font; no runtime font provider.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const manrope = Manrope({ subsets: ["latin"], display: "swap", variable: "--font-manrope" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: "500", display: "swap", preload: false, variable: "--font-ibm-plex-mono" });

// Institutional metadata follows the settings saved in the admin; the site URL
// stays deployment configuration (NEXT_PUBLIC_SITE_URL).
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: `${settings.companyName}`,
      template: `%s | ${settings.companyName}`
    },
    // The meta description follows the panel, so it is editable without a deploy.
    description: settings.description || undefined,
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
    icons: {
      icon: [16, 32, 48, 64, 128, 256, 512].map((size) => ({
        url: `/brand/jhconsulting-app-icon-${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png"
      })),
      apple: { url: "/brand/jhconsulting-app-icon-256.png", sizes: "256x256", type: "image/png" }
    },
    robots: { index: true, follow: true }
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return <html lang="pt-BR" className={`${inter.variable} ${manrope.variable} ${mono.variable}`}><body><noscript><style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style></noscript>{children}{gaId ? <><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive"/><Script id="ga" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${gaId}');`}</Script></> : null}</body></html>;
}
