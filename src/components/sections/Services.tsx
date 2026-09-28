import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { listActiveServices } from "@/lib/repositories/public-services";
import { resolveServiceIcon } from "@/lib/services/icons";

type ServiceCard = { key: string; title: string; description: string; icon: string; tech: string };

/**
 * Services come from /admin/servicos. A failed query degrades to the neutral
 * empty state instead of a copy bundled at build time: once the panel is in
 * use, that copy would be wrong, and showing outdated services is worse than
 * showing none. ISR also keeps serving the last good render, so this is a last
 * resort rather than the usual path.
 */
async function loadServices(): Promise<ServiceCard[]> {
  try {
    const services = await listActiveServices();
    return services.map((service) => ({
      key: service.id,
      title: service.title,
      description: service.description,
      icon: service.icon,
      tech: service.tech
    }));
  } catch (error) {
    console.error(`[home] serviços indisponíveis: ${(error as Error).message}`);
    return [];
  }
}

export async function Services() {
  const services = await loadServices();
  return (
    <section id="servicos" className="section-space bg-white/[.018]">
      <div className="container-shell">
        <SectionHeading
          kicker="Serviços"
          title="Soluções tecnológicas pensadas para o processo da sua empresa"
          copy="A tecnologia entra depois do entendimento do problema. O foco é reduzir gargalos, integrar informações e criar uma operação mais confiável."
        />
        {services.length ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service, index) => {
              const Icon = resolveServiceIcon(service.icon);
              return (
                <Reveal key={service.key} delay={Math.min(index * 0.04, 0.2)}>
                  <article className="card group h-full rounded-2xl p-5 transition hover:-translate-y-1 hover:border-blue-400/35">
                    <Icon className="text-blue-400 transition group-hover:scale-110" size={24} />
                    <h3 className="mt-6 text-lg font-bold">{service.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{service.description}</p>
                    {service.tech ? <p className="mt-5 border-t border-white/6 pt-4 text-xs font-semibold text-slate-500">{service.tech}</p> : null}
                  </article>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <p className="mt-12 text-slate-400">Serviços serão publicados em breve.</p>
        )}
      </div>
    </section>
  );
}
