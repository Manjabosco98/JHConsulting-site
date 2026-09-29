import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getSiteSettings } from "@/lib/repositories/public-settings";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * Hero em split assimétrico: mensagem à esquerda, retrato à direita.
 *
 * O que saiu daqui, e por quê:
 *
 * - O card "JHConsulting Core" era uma interface inventada em `<div>`: pipeline
 *   Diagnóstico → Arquitetura → Entrega, barra de progresso parada em 86% e uma
 *   bolinha de status com brilho neon. Nada ali media nada. Preview de produto
 *   falso é a assinatura mais reconhecível de página gerada por IA, e o visitante
 *   que tentar entender o número não encontra referência nenhuma.
 * - A malha de linhas (`.grid-lines`) era decoração: não organizava conteúdo.
 * - O bloco nome + cargo abaixo dos botões era um quinto bloco de texto no que
 *   deve ser um único momento de leitura. O cargo passou para a seção Sobre,
 *   que é onde o visitante procura quem está por trás.
 *
 * O ativo visual agora é real: a foto profissional gravada em /admin/configuracoes.
 * Para uma consultoria de uma pessoa, o rosto é o que constrói confiança, e era
 * a única imagem real do site, escondida na décima seção. Ela é o elemento de
 * LCP da home, daí o `priority`.
 *
 * Sem foto configurada o hero colapsa para uma coluna só, com medida de texto
 * mais larga. Não entra caixa de placeholder: espaço vazio rotulado é pior do
 * que uma composição que se resolve sozinha.
 */
/*
 * Altura mínima de 40rem, e não a viewport inteira. Com `100dvh-5rem` o conteúdo
 * (cerca de 470px) ficava centrado dentro de 819px e sobravam 245px de vazio
 * acima da pílula, o que lê como erro de layout e não como respiro. Em 40rem a
 * folga fica em torno de 80px.
 *
 * O efeito colateral é bom: a seção seguinte aparece na dobra e mostra que a
 * página continua, sem precisar de um rótulo "role para baixo".
 *
 * A proporção 1.25/.75 das colunas foi medida, não estimada: ela dá ao título a
 * largura exata para caber em duas linhas no tamanho escolhido.
 */
const LAYOUT = "container-shell grid items-center gap-12 py-16 sm:py-20 lg:min-h-[40rem]";
const SPLIT = "lg:grid-cols-[1.25fr_.75fr]";

export async function Hero() {
  const settings = await getSiteSettings();
  const hasPhoto = Boolean(settings.profileImageUrl);

  return (
    <section id="inicio" className="overflow-hidden border-b border-white/5">
      <div className={hasPhoto ? `${LAYOUT} ${SPLIT}` : LAYOUT}>
        <div className={hasPhoto ? "" : "max-w-3xl"}>
          <p className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/7 px-3 py-1.5 text-xs font-bold text-blue-200">
            <CheckCircle2 size={14} aria-hidden="true" /> Tecnologia aplicada a problemas reais de negócios
          </p>
          {/* Escala medida, não estimada: com esta coluna (~708px em 1440), 60px
            * e 52px quebram o título em três linhas, e o limite são duas. Em
            * 48px cabe em duas, que é o maior tamanho que respeita a regra. */}
          <h1 className="mt-7 text-4xl font-bold leading-[1.05] tracking-[-.04em] text-balance sm:text-5xl">
            Transformo processos manuais em <span className="text-gradient">soluções inteligentes.</span>
          </h1>
          <p className="mt-6 max-w-[46ch] text-base leading-8 text-slate-300 sm:text-lg">
            Sistemas, automações, integrações e dados para empresas que querem operar com menos trabalho manual.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href={whatsappLink(settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold transition hover:bg-blue-500 active:translate-y-px"
            >
              Solicitar orçamento <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a
              href="#solucoes"
              className="focus-ring rounded-xl border border-white/12 px-5 py-3.5 font-bold text-slate-200 transition hover:bg-white/5 active:translate-y-px"
            >
              Conhecer soluções
            </a>
          </div>
        </div>

        {settings.profileImageUrl ? (
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            {/* Brilho atrás da imagem: o gradiente azul faz parte da identidade
              * registrada na SPEC. Fica no fundo, não substitui o ativo visual. */}
            <div className="absolute -inset-8 -z-10 rounded-full bg-blue-500/10 blur-3xl" aria-hidden="true" />
            {/* A foto enviada no painel tem 604x662 (proporção 0,91). Um quadro
              * 4/5 cortaria as bordas dela; 9/10 acompanha o original e preserva
              * o enquadramento que você escolheu ao subir a imagem. */}
            <div className="relative aspect-[9/10] overflow-hidden rounded-3xl border border-white/10">
              <Image
                src={settings.profileImageUrl}
                // Só o nome: o cargo cadastrado no painel traz pontos médios
                // ("Analista • Desenvolvedor • Especialista"), que o leitor de
                // tela anuncia um por um. O cargo já é texto visível em Sobre.
                alt={`Foto de ${settings.professionalName}`}
                fill
                priority
                sizes="(min-width: 1024px) 42vw, (min-width: 640px) 28rem, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
