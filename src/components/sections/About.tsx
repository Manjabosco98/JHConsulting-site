import { ArrowRight, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";

/**
 * Sobre, em coluna editorial única.
 *
 * A foto profissional saiu daqui e subiu para o Hero: era a única imagem real da
 * home e estava na décima seção, enquanto o topo da página se sustentava num card
 * inventado. Sem a foto, esta seção deixa de ser mais um split de duas colunas
 * (havia quatro na página) e passa a ser o único momento de texto corrido, o que
 * dá à home uma pausa de leitura que ela não tinha.
 *
 * O cargo (`settings.role`) aparece aqui pela primeira vez: ele existe no painel,
 * alimentava só o card social e o rodapé do Hero, e nunca foi exibido na seção
 * que responde "quem é essa pessoa".
 */
export async function About() {
  const settings = await getSiteSettings();
  const firstName = settings.professionalName.split(" ")[0];

  return (
    <section id="sobre" className="section-space bg-white/[.018]">
      <div className="container-shell">
        <div className="max-w-3xl">
          <h2 className="section-title mt-0">Sobre {firstName}</h2>
          {settings.role ? <p className="mt-4 text-lg text-blue-200/90">{settings.role}</p> : null}

          <div className="mt-8 max-w-[62ch] space-y-4 text-base leading-8 text-slate-300">
            {settings.bio.length ? (
              settings.bio.map((paragraph, index) => (
                <p key={index} className={index === settings.bio.length - 1 ? "text-slate-400" : undefined}>{paragraph}</p>
              ))
            ) : (
              <p>{settings.description}</p>
            )}
          </div>
        </div>

        <dl className="mt-12 grid max-w-3xl gap-6 border-t border-white/8 pt-8 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Base</dt>
            <dd className="mt-2 flex items-center gap-2 text-sm text-slate-300">
              <MapPin size={15} aria-hidden="true" />{settings.location}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Atendimento</dt>
            <dd className="mt-2 text-sm text-slate-300">{settings.serviceArea}</dd>
          </div>
        </dl>

        <a href="#contato" className="focus-ring mt-10 inline-flex items-center gap-2 font-bold text-blue-300 transition hover:text-blue-200">
          Quero analisar meu processo <ArrowRight size={18} aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
