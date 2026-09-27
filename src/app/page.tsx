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
import { siteConfig } from "@/constants/site";

export default function Home() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    areaServed: "BR",
    founder: { "@type": "Person", name: siteConfig.professional },
    address: { "@type": "PostalAddress", addressLocality: "Goiânia", addressRegion: "GO", addressCountry: "BR" }
  };

  return <><Navbar/><main><Hero/><Authority/><Problems/><Services/><Automation/><Solutions/><Projects/><Workflow/><Technologies/><About/><Differentials/><PrimaryCTA/><Contact/></main><Footer/><WhatsAppButton/><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/></>;
}
