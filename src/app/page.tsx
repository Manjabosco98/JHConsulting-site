import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Authority } from "@/components/sections/Authority";
import { Problems } from "@/components/sections/Problems";
import { Services } from "@/components/sections/Services";
import { Automation } from "@/components/sections/Automation";
import { Solutions } from "@/components/sections/Solutions";
import { Projects } from "@/components/sections/Projects";
import { Workflow } from "@/components/sections/Workflow";
import { Technologies } from "@/components/sections/Technologies";
import { About } from "@/components/sections/About";
import { Differentials } from "@/components/sections/Differentials";
import { PrimaryCTA } from "@/components/sections/PrimaryCTA";
import { Contact } from "@/components/sections/Contact";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/constants/site";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";

// ISR: home is regenerated hourly and on demand (admin edits call
// revalidatePath("/")). Projects, services, technologies and the institutional
// settings come from Supabase.
export const revalidate = 3600;

export default async function Home() {
  const settings = await getSiteSettings();
  const [city, state] = settings.location.split(",").map((part) => part.trim());
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: settings.companyName,
    url: siteConfig.url,
    description: settings.description,
    areaServed: "BR",
    founder: { "@type": "Person", name: settings.professionalName },
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.whatsapp ? { telephone: settings.whatsapp } : {}),
    ...(settings.profileImageUrl ? { image: settings.profileImageUrl } : {}),
    sameAs: [settings.linkedinUrl, settings.githubUrl, settings.instagramUrl].filter(Boolean),
    address: { "@type": "PostalAddress", addressLocality: city, addressRegion: state, addressCountry: "BR" }
  };

  return (
    <>
      <Navbar whatsappUrl={whatsappLink(settings.whatsapp)} />
      <main>
        <Hero />
        <Authority />
        <Problems />
        <Services />
        <Automation />
        <Solutions />
        <Projects />
        <Workflow />
        <Technologies />
        <About />
        <Differentials />
        <PrimaryCTA />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
      <JsonLd data={schema} />
    </>
  );
}
