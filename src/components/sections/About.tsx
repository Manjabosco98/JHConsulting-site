import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";

/**
 * Retrato institucional e biografia.
 *
 * A foto é o único rosto do site e a única prova de que existe alguém por trás
 * da marca, por isso ganhou escala (até 480px contra 420px) e uma moldura em
 * camadas: um contorno deslocado atrás, um aro em gradiente na própria imagem e
 * uma sombra com deslocamento e desfoque reais. As três camadas juntas afastam o
 * retrato do fundo — uma imagem encostada numa borda de 1px lê-se como anexo,
 * não como peça.
 *
 * `object-cover` e não `object-contain`: a imagem vem do painel e o próximo
 * upload pode ter outra proporção. Com `contain` ela ficaria com barras dentro
 * da moldura; com `cover` a moldura continua cheia em qualquer proporção.
 *
 * A ordem da coluna de texto é papel → biografia → base/atendimento → chamada.
 * Antes a chamada vinha antes dos dados institucionais e a secção terminava em
 * metadados; terminar na chamada deixa a última linha a pedir a ação.
 */
export async function About() {
  const settings = await getSiteSettings();
  const firstName = settings.professionalName.split(" ")[0];

  return (
    <section id="sobre" className="section-space surface-raised">
      <div className="container-shell">
        <h2 className="section-title mt-0">Sobre {firstName}</h2>

        <div
          className={`mt-12 grid items-start gap-10 lg:gap-16 ${
            // Duas colunas só a partir de `lg`. Em `md` a coluna do retrato dava
            // 300px e a foto caía para 285px — menor do que fica empilhada, que
            // é o contrário do que a divisão em colunas existe para fazer.
            settings.profileImageUrl ? "lg:grid-cols-[.92fr_1.08fr]" : "max-w-3xl"
          }`}
        >
          {settings.profileImageUrl ? (
            <figure className="about-figure">
              <span className="about-figure-plate" aria-hidden="true" />
              <div className="about-portrait relative aspect-[604/662] w-full overflow-hidden">
                <Image
                  src={settings.profileImageUrl}
                  alt={`Foto de ${settings.professionalName}`}
                  fill
                  sizes="(min-width: 1280px) 480px, (min-width: 768px) 40vw, calc(100vw - 2.5rem)"
                  className="object-cover"
                />
              </div>
            </figure>
          ) : null}

          <div className="min-w-0">
            {settings.role ? <p className="about-role">{settings.role}</p> : null}

            <div className="mt-6 max-w-[62ch] space-y-4 text-base leading-8 text-slate-300">
              {settings.bio.length ? (
                settings.bio.map((paragraph, index) => (
                  <p key={index} className={index === settings.bio.length - 1 ? "text-slate-400" : undefined}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>{settings.description}</p>
              )}
            </div>

            <dl className="mt-10 grid gap-6 border-t border-white/8 pt-7 sm:grid-cols-2">
              <div>
                <dt className="meta-label">Base</dt>
                <dd className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                  <MapPin className="shrink-0 text-blue-300" size={15} aria-hidden="true" />
                  {settings.location}
                </dd>
              </div>
              <div>
                <dt className="meta-label">Atendimento</dt>
                <dd className="mt-2 text-sm text-slate-300">{settings.serviceArea}</dd>
              </div>
            </dl>

            <a href="#contato" className="link-arrow focus-ring mt-9 inline-flex items-center gap-2 font-bold text-blue-300">
              Quero analisar meu processo <ArrowRight className="link-arrow-icon" size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
