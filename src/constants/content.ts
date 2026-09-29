// Editorial copy of the landing page: narrative that belongs to the page, not
// content the client edits. Projects, services and technologies used to live
// here too; they come from Supabase since phase 14 and are managed in /admin.

export const authority = [
  ["Automação", "Reduza tarefas manuais e repetitivas."],
  ["Sistemas", "Tenha ferramentas alinhadas ao seu processo."],
  ["Integrações", "Conecte sistemas, APIs e bancos de dados."],
  ["Dados", "Transforme dados em decisões mais rápidas."]
] as const;

export const problems = [
  "Copiar informações manualmente entre sistemas",
  "Preencher e consolidar planilhas todos os dias",
  "Baixar documentos e relatórios repetitivamente",
  "Consultar portais e alimentar sistemas manualmente",
  "Sistemas que não se comunicam",
  "Falta de dashboards e indicadores confiáveis"
] as const;

export const solutions = [
  ["Automação Fiscal", "Consulta, download e processamento de documentos fiscais."],
  ["Automação Contábil", "Integração e processamento de rotinas administrativas e contábeis."],
  ["Automação Financeira", "Relatórios, conciliações, arquivos e dados financeiros."],
  ["Integração de Sistemas", "Comunicação entre plataformas sem integração nativa."],
  ["Dashboards Empresariais", "Indicadores centralizados para gestão e tomada de decisão."],
  ["Sistemas Internos", "Ferramentas específicas para processos da empresa."]
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

export const automationFlow = ["Processo manual", "Análise", "Automação", "Monitoramento", "Resultado"] as const;

export const automationBenefits = ["Menos trabalho manual", "Menos erros", "Mais produtividade", "Padronização", "Rastreabilidade", "Escalabilidade"] as const;
