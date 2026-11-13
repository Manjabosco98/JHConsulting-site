import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Authority } from "@/components/sections/Authority";
import { Services } from "@/components/sections/Services";
import { Solutions } from "@/components/sections/Solutions";
import { Workflow } from "@/components/sections/Workflow";
import { About } from "@/components/sections/About";
import { Differentials } from "@/components/sections/Differentials";
import { FAQ } from "@/components/sections/FAQ";
import { PrimaryCTA } from "@/components/sections/PrimaryCTA";
import { Contact } from "@/components/sections/Contact";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/constants/site";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { listActiveServices } from "@/lib/repositories/public-services";

export const revalidate = 3600;

export default async function Home() {
  const settings = await getSiteSettings();
  const [city, state] = settings.location.split(",").map((part) => part.trim());
  const services = await listActiveServices().catch((error) => {
    console.error(`[home] serviços indisponíveis: ${(error as Error).message}`);
    return [];
  });
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteConfig.url}/#empresa`,
    name: settings.companyName,
    url: siteConfig.url,
    description: settings.description,
    areaServed: "BR",
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.whatsapp ? { telephone: settings.whatsapp } : {}),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços da JHConsulting",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.description
        }
      }))
    },
    ...(city ? { address: { "@type": "PostalAddress", addressLocality: city, addressRegion: state, addressCountry: "BR" } } : {})
  };

  return (
    <>
      <a href="#conteudo" className="skip-link focus-ring">Ir para o conteúdo</a>
      <Navbar />
      <main id="conteudo">
        <Hero />
        <Authority />
        <About />
        <Services services={services} />
        <Solutions />
        <Workflow />
        <Differentials />
        <FAQ />
        <PrimaryCTA />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      <JsonLd data={schema} />
    </>
  );
}
