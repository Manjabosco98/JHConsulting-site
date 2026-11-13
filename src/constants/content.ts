// Editorial copy of the landing page: narrative that belongs to the page, not
// content the client edits. Projects, services and technologies used to live
// here too; they come from Supabase since phase 14 and are managed in /admin.

/**
 * Os quatro pilares, com o ícone de cada um.
 *
 * O terceiro item da tupla é o *nome* do ícone, e não o componente, pelo mesmo
 * motivo que `services.icon` guarda um nome no banco: este arquivo é dado puro,
 * sem React nem JSX, e importar de `lucide-react` aqui faria a copy da página
 * depender de uma biblioteca de UI.
 *
 * Quem resolve o nome é `Authority.tsx`, e a resolução é verificada em tempo de
 * compilação: com `as const` o nome é um literal, então um erro de digitação aqui
 * não compila lá. Não existe fallback silencioso como em `resolveServiceIcon`,
 * porque ali o valor vem do painel e aqui vem do código.
 */
export const authority = [
  ["Menos retrabalho", "Automações para simplificar rotinas repetitivas.", "Bot"],
  ["Mais clareza na gestão", "Dashboards e dados para acompanhar o negócio.", "ChartNoAxesCombined"],
  ["Informações conectadas", "Integrações entre sistemas e fontes de dados.", "Network"],
  ["Operação sob medida", "Sistemas alinhados aos processos da empresa.", "Layers3"]
] as const;

/**
 * As seis dores da operação, com o ícone de cada uma.
 *
 * O segundo item da tupla é o *nome* do ícone, e não o componente, pelo mesmo
 * motivo documentado em `authority`: este arquivo é dado puro, sem React nem
 * JSX. Quem resolve o nome é `Problems.tsx`, e a resolução é verificada em
 * tempo de compilação — com `as const` o nome é um literal, então um erro de
 * digitação aqui não compila lá.
 *
 * As frases são as que já estavam na página, palavra por palavra: elas nomeiam
 * o trabalho manual que os serviços reais atendem, e são mais específicas que
 * as da especificação ("Consultar portais e alimentar sistemas manualmente"
 * contra "Consultar portais e sistemas externos"). Só a estrutura mudou, de
 * lista de frases para frase mais ícone, porque seis marcadores de "check"
 * iguais não diferenciavam uma dor da outra — a faixa era para ser varrida com
 * os olhos e só podia ser lida.
 *
 * Não há descrição de apoio de propósito: escrever seis frases novas aqui seria
 * inventar posicionamento comercial que ninguém aprovou, e a seção pede
 * densidade, não altura.
 */
export const problems = [
  ["Copiar informações manualmente entre sistemas", "Copy"],
  ["Preencher e consolidar planilhas todos os dias", "Table2"],
  ["Baixar documentos e relatórios repetitivamente", "FileDown"],
  ["Consultar portais e alimentar sistemas manualmente", "Globe"],
  ["Sistemas que não se comunicam", "Unplug"],
  /*
   * `EyeOff` e não `ChartNoAxesCombined`: o gráfico já é o ícone do pilar
   * "Dados", logo acima nesta mesma página, e repeti-lo aqui faria a dor
   * parecer o mesmo assunto que a solução. A dor é a falta de visibilidade.
   */
  ["Falta de dashboards e indicadores confiáveis", "EyeOff"]
] as const;

export const solutions = [
  ["Automação Fiscal", "Consulta, download e processamento de documentos fiscais.", "FileDown"],
  ["Automação Contábil", "Integração e processamento de rotinas administrativas e contábeis.", "Calculator"],
  ["Automação Financeira", "Relatórios, conciliações, arquivos e dados financeiros.", "Wallet"],
  ["Integração de Sistemas", "Comunicação entre plataformas sem integração nativa.", "Network"],
  ["Dashboards Empresariais", "Indicadores centralizados para gestão e tomada de decisão.", "ChartNoAxesCombined"],
  ["Sistemas Internos", "Ferramentas específicas para processos da empresa.", "Layers3"]
] as const;

/**
 * As seis etapas do projeto, agrupadas em três fases.
 *
 * Antes eram seis itens com o número escrito à mão (`"01"`… `"06"`) renderizados
 * como seis cards iguais. Duas coisas estavam erradas ali: o rótulo numérico não
 * acrescenta nada que a ordem de leitura já não diga, e seis cards idênticos
 * eram a quinta ocorrência do mesmo grid de colunas iguais na home. Agrupar em
 * três fases dá ao visitante uma estrutura para lembrar, em vez de uma lista
 * para percorrer, e reduz os seis fios de divisão para dois.
 */
export const workflowPhases = [
  {
    phase: "Descoberta",
    steps: [
      ["Entendimento", "Conversa sobre a necessidade, a rotina atual e o resultado esperado."],
      ["Proposta", "Alinhamento de escopo, entregas, responsabilidades, prazos e investimento."]
    ]
  },
  {
    phase: "Construção",
    steps: [
      ["Desenvolvimento", "Construção da solução com acompanhamento das entregas combinadas."],
      ["Validação", "Testes e conferência do funcionamento com os responsáveis pela operação."]
    ]
  },
  {
    phase: "Operação",
    steps: [
      ["Implantação", "Configuração, entrada em operação e orientação para uso da solução."],
      ["Evolução", "Suporte, manutenção e melhorias conforme as condições contratadas."]
    ]
  }
] as const;

export const differentiators = [
  ["Soluções sob medida", "O escopo considera as necessidades, os sistemas e o contexto da empresa."],
  ["Entendimento do negócio", "A análise da rotina ajuda a definir prioridades antes do desenvolvimento."],
  ["Entregas claras", "Escopo, responsabilidades e critérios de validação alinhados desde o início."],
  ["Documentação e continuidade", "Orientações e organização técnica para facilitar o uso e a manutenção."],
  ["Acompanhamento", "Possibilidade de suporte e evolução contínua, conforme o serviço contratado."]
] as const;

/** Illustrative applications of the services, not claims about completed work. */
export const businessApplications = [
  {
    area: "Rotinas administrativas e contábeis",
    outcome: "Menos tempo em tarefas repetitivas",
    need: "Coletar documentos, consultar portais e consolidar planilhas pode ocupar boa parte do dia.",
    delivery: "automações de coleta, organização e processamento de informações para reduzir etapas manuais."
  },
  {
    area: "Gestão financeira",
    outcome: "Mais visibilidade sobre os números",
    need: "Informações espalhadas dificultam a leitura de receitas, despesas e resultados.",
    delivery: "consolidação de dados e dashboards para acompanhar indicadores financeiros em um só lugar."
  },
  {
    area: "Comercial e operação",
    outcome: "Informação disponível para agir",
    need: "Controles separados tornam mais difícil acompanhar vendas, atividades e pendências.",
    delivery: "integrações e ferramentas internas para organizar o fluxo de trabalho e apoiar o acompanhamento da operação."
  },
  {
    area: "Dados e documentos",
    outcome: "Bases organizadas para decisões melhores",
    need: "Arquivos de diferentes fontes e formatos exigem preparação antes de se tornarem úteis.",
    delivery: "tratamento de dados, atualização de bases e recursos de IA para apoiar a consulta e a análise de informações."
  }
] as const;

export const frequentlyAskedQuestions = [
  ["Como solicitar uma proposta?", "Envie sua necessidade pelo formulário ou pelo WhatsApp. A JHConsulting conversa com você para entender o processo atual e definir o escopo, as entregas e as condições da proposta."],
  ["Preciso saber qual tecnologia usar?", "Você pode começar descrevendo o problema e o resultado que espera. A escolha das ferramentas acontece a partir da análise da rotina, dos sistemas existentes e das condições de implantação."],
  ["É possível integrar os sistemas que a empresa já utiliza?", "A viabilidade é analisada conforme os recursos de cada sistema, como APIs, arquivos e permissões de acesso. A proposta considera essas possibilidades e as limitações encontradas."],
  ["O atendimento pode ser remoto?", "Sim. A JHConsulting está em Goiânia e atende empresas de todo o Brasil de forma remota. As necessidades de acesso e implantação são alinhadas durante o diagnóstico."],
  ["Como são definidos os prazos e o investimento?", "Eles dependem do escopo, da complexidade, das integrações e das informações disponíveis. A proposta apresenta as entregas e as condições antes do início do serviço."],
  ["Há suporte após a entrega?", "Suporte, manutenção e evolução podem fazer parte da contratação. O período, os canais e a abrangência do atendimento são definidos na proposta."]
] as const;

export const automationFlow = [
  ["Processo manual", "Rotinas repetitivas identificadas na operação.", "ClipboardList"],
  ["Análise", "Entendimento do problema e do processo atual.", "ScanSearch"],
  ["Automação", "Construção da solução para a rotina.", "Bot"],
  ["Monitoramento", "Validação e acompanhamento contínuos.", "Activity"],
  ["Resultado", "Mais controle, produtividade e escala.", "TrendingUp"]
] as const;

export const automationBenefits = ["Menos trabalho manual", "Menos erros", "Mais produtividade", "Padronização", "Rastreabilidade", "Escalabilidade"] as const;
