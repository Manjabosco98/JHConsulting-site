import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";

export async function About() {
  const settings = await getSiteSettings();
  const firstName = settings.professionalName.split(" ")[0];

  return (
    <section id="sobre" className="section-space bg-white/[.018]">
      <div className="container-shell grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
        {settings.profileImageUrl ? (
          <div className="relative min-h-[420px] overflow-hidden rounded-3xl border border-white/10">
            <Image
              src={settings.profileImageUrl}
              alt={`Foto de ${settings.professionalName}`}
              fill
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="card grid min-h-[420px] place-items-center rounded-3xl border-dashed">
            <div className="text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-blue-500/10 text-2xl font-black text-blue-300">JH</div>
              <p className="mt-4 text-sm font-bold">Foto profissional</p>
              <p className="mt-1 text-xs text-slate-500">Configurável no painel</p>
            </div>
          </div>
        )}
        <div>
          <p className="section-kicker">Sobre</p>
          <h2 className="section-title">Sobre {firstName}</h2>
          <div className="mt-6 space-y-4 text-base leading-8 text-slate-300">
            {settings.bio.length ? (
              settings.bio.map((paragraph, index) => (
                <p key={index} className={index === settings.bio.length - 1 ? "text-slate-400" : undefined}>{paragraph}</p>
              ))
            ) : (
              <p>{settings.description}</p>
            )}
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
            <MapPin size={16} />{settings.location} • {settings.serviceArea}
          </div>
          <a href="#contato" className="focus-ring mt-7 inline-flex items-center gap-2 font-bold text-blue-300">
            Vamos conversar sobre seu projeto <ArrowRight size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
