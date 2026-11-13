import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { listActiveServices, type PublicService } from "@/lib/repositories/public-services";
import { resolveServiceIcon } from "@/lib/services/icons";

async function loadServices(): Promise<PublicService[]> {
  try {
    return await listActiveServices();
  } catch (error) {
    console.error(`[home] serviços indisponíveis: ${(error as Error).message}`);
    return [];
  }
}

/** The catalog and its order remain managed in /admin/servicos. */
export async function Services({ services: supplied }: { services?: PublicService[] } = {}) {
  const services = supplied ?? await loadServices();
  return (
    <section id="servicos" className="section-space surface-raised">
      <div className="container-shell">
        <SectionHeading kicker="Serviços" title="O que a JHConsulting faz pela sua empresa"
          copy="Soluções para reduzir tarefas manuais, conectar informações e dar mais visibilidade à gestão. O escopo é definido a partir da necessidade da sua operação." />
        {services.length ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = resolveServiceIcon(service.icon);
              return (
                <Reveal key={service.id}>
                  <article className="service-card card flex h-full flex-col rounded-2xl p-6 sm:p-7">
                    <span className="icon-tile"><Icon size={19} aria-hidden="true" /></span>
                    <h3 className="mt-5 text-xl font-bold">{service.title}</h3>
                    <p className="mt-3 grow text-sm leading-7 text-slate-300">{service.description}</p>
                    <a href="#contato" aria-label={`Conversar sobre ${service.title}`} className="focus-ring mt-7 inline-flex items-center justify-between gap-3 border-t border-white/10 pt-5 text-sm font-bold text-blue-200">
                      Conversar sobre esta solução <ArrowUpRight size={17} className="shrink-0" aria-hidden="true" />
                    </a>
                  </article>
                </Reveal>
              );
            })}
          </div>
        ) : <p className="mt-12 text-slate-400">Serviços serão publicados em breve.</p>}
      </div>
    </section>
  );
}
