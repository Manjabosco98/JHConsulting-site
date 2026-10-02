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
/**
 * A linha de tecnologias vem do painel como texto editorial, no formato que o
 * conteúdo semeado usa: "Python • Playwright • Selenium • APIs". Virou um chip
 * por item porque cada token já é um nome isolado no banco — nada aqui é
 * inventado, é a mesma linha partida nos separadores que ela própria usa.
 *
 * Separa por `•`, vírgula e barra vertical, os três que aparecem no conteúdo e
 * que o painel aceita. Não separa por `/`, senão "ETL/ELT" viraria dois chips.
 * Sem separador, a linha inteira vira um chip só; vazia (a coluna tem
 * `default ''`) não gera nada.
 */
function techChips(tech: string): string[] {
  return tech
    .split(/[•,|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

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
    <section id="servicos" className="section-space surface-raised">
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
              const chips = techChips(service.tech);
              return (
                <Reveal key={service.key} delay={Math.min(index * 0.04, 0.2)}>
                  {/* `flex flex-col` existe para o `grow` do parágrafo abaixo:
                    * é ele que alinha a faixa de chips na base de todos os
                    * cards da linha, em vez de deixá-la flutuar onde a descrição
                    * terminar. O `group` saiu junto com o `scale-110` do ícone,
                    * que era a única coisa que o usava. */}
                  <article className="card flex h-full flex-col rounded-2xl p-5 transition hover:-translate-y-1 hover:border-blue-400/35">
                    {/* Mesmo recipiente dos quatro pilares — 40px, traço de
                      * 18px, `rounded-xl` da escala de raios. Antes o ícone
                      * ficava solto a 24px, que era o único ícone da home sem
                      * caixa, e `aria-hidden` faltava: ele é decorativo, o
                      * título ao lado já nomeia o serviço. */}
                    <span className="icon-tile">
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-lg font-bold">{service.title}</h3>
                    {/* `slate-400` no lugar de `slate-500` (4,08:1, abaixo do
                      * mínimo AA de 4,5:1) e `white/8` no lugar de `white/6`,
                      * que era um sexto valor de opacidade de borda fazendo o
                      * mesmo trabalho visual de um que já existia. */}
                    <p className="mt-3 grow text-sm leading-6 text-slate-400">{service.description}</p>
                    {chips.length ? (
                      <ul className="mt-5 flex flex-wrap gap-1.5 border-t border-white/8 pt-4">
                        {chips.map((chip) => (
                          /* `rounded-full`: a escala de raios reserva a pílula
                           * para badges e chips de tecnologia. */
                          <li key={chip} className="rounded-full border border-white/8 px-2.5 py-1 text-xs font-semibold text-slate-400">
                            {chip}
                          </li>
                        ))}
                      </ul>
                    ) : null}
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
