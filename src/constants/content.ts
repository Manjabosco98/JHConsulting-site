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
  ["Automação", "Reduza tarefas manuais e repetitivas.", "Bot"],
  ["Sistemas", "Tenha ferramentas alinhadas ao seu processo.", "Layers3"],
  ["Integrações", "Conecte sistemas, APIs e bancos de dados.", "Network"],
  ["Dados", "Transforme dados em decisões mais rápidas.", "ChartNoAxesCombined"]
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
      ["Entendimento", "Análise do problema e do processo atual."],
      ["Planejamento", "Definição da solução, arquitetura e tecnologias."]
    ]
  },
  {
    phase: "Construção",
    steps: [
      ["Desenvolvimento", "Construção da automação, sistema ou integração."],
      ["Testes", "Validação técnica, funcional e de cenários críticos."]
    ]
  },
  {
    phase: "Operação",
    steps: [
      ["Implantação", "Deploy, configuração e entrada em produção."],
      ["Evolução", "Monitoramento, manutenção e melhorias contínuas."]
    ]
  }
] as const;

export const differentiators = [
  ["Soluções personalizadas", "Cada projeto é construído conforme a necessidade real da empresa."],
  ["Visão de processo", "Antes de automatizar, o processo é entendido e estruturado."],
  ["Tecnologia adequada", "A ferramenta é escolhida pela necessidade, não pelo modismo."],
  ["Escalabilidade", "A solução é pensada para evoluir sem virar um gargalo."],
  ["Manutenção", "Possibilidade de acompanhamento, suporte e evolução contínua."]
] as const;

export const automationFlow = [
  ["Processo manual", "Rotinas repetitivas identificadas na operação.", "ClipboardList"],
  ["Análise", "Entendimento do problema e do processo atual.", "ScanSearch"],
  ["Automação", "Construção da solução para a rotina.", "Bot"],
  ["Monitoramento", "Validação e acompanhamento contínuos.", "Activity"],
  ["Resultado", "Mais controle, produtividade e escala.", "TrendingUp"]
] as const;

export const automationBenefits = ["Menos trabalho manual", "Menos erros", "Mais produtividade", "Padronização", "Rastreabilidade", "Escalabilidade"] as const;
