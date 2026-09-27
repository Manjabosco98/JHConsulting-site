import {
  Bot,
  Braces,
  ChartNoAxesCombined,
  Database,
  FileCog,
  GitBranch,
  Layers3,
  Network,
  ServerCog,
  Sparkles
} from "lucide-react";

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

export const services = [
  {
    title: "Automação de Processos",
    description: "Automatize rotinas operacionais, administrativas, fiscais e financeiras com rastreabilidade e controle.",
    icon: Bot,
    tech: "Python • Playwright • Selenium • APIs"
  },
  {
    title: "Desenvolvimento de Sistemas",
    description: "Sistemas internos, plataformas web, painéis administrativos e aplicações corporativas sob medida.",
    icon: Layers3,
    tech: "Next.js • Python • Django • FastAPI"
  },
  {
    title: "APIs e Integrações",
    description: "Conecte sistemas e elimine retrabalho com APIs REST, webhooks e serviços backend.",
    icon: Network,
    tech: "REST • Webhooks • OAuth • Banco de Dados"
  },
  {
    title: "Dashboards e Dados",
    description: "Transforme dados dispersos em indicadores e relatórios que apoiam decisões de negócio.",
    icon: ChartNoAxesCombined,
    tech: "Power BI • Power Query • Excel • Python"
  },
  {
    title: "Engenharia de Dados",
    description: "Pipelines, ETL/ELT, cargas automatizadas e integração entre fontes de dados.",
    icon: Database,
    tech: "SQL • Airflow • Spark • ETL"
  },
  {
    title: "Inteligência Artificial",
    description: "Agentes, chatbots, análise documental e automações com LLMs aplicadas ao negócio.",
    icon: Sparkles,
    tech: "OpenAI • LLMs • Agentes • APIs de IA"
  },
  {
    title: "Backend e Arquitetura",
    description: "Serviços robustos, organização de regras de negócio, segurança e integração entre aplicações.",
    icon: ServerCog,
    tech: "Python • FastAPI • PostgreSQL • Docker"
  },
  {
    title: "Consultoria Tecnológica",
    description: "Mapeamento do processo atual, identificação de gargalos e desenho da solução mais adequada.",
    icon: FileCog,
    tech: "Processos • Arquitetura • Roadmap • Evolução"
  }
] as const;

export const solutions = [
  ["Automação Fiscal", "Consulta, download e processamento de documentos fiscais."],
  ["Automação Contábil", "Integração e processamento de rotinas administrativas e contábeis."],
  ["Automação Financeira", "Relatórios, conciliações, arquivos e dados financeiros."],
  ["Integração de Sistemas", "Comunicação entre plataformas sem integração nativa."],
  ["Dashboards Empresariais", "Indicadores centralizados para gestão e tomada de decisão."],
  ["Sistemas Internos", "Ferramentas específicas para processos da empresa."]
] as const;

export const projects = [
  {
    title: "SGECHAT",
    category: "Plataforma empresarial",
    problem: "Centralizar comunicação, templates e fluxos operacionais em um ambiente único.",
    solution: "Plataforma com chat, gestão de conversas, templates, emails, usuários, integrações e automações.",
    technologies: ["Next.js", "APIs", "Supabase", "Resend"],
    status: "Case em evolução"
  },
  {
    title: "Automação Fiscal / NFS-e",
    category: "Automação empresarial",
    problem: "Rotinas repetitivas de consulta, download e estruturação de documentos fiscais.",
    solution: "Automação de portais, leitura de XML e processamento estruturado de notas e documentos.",
    technologies: ["Python", "Playwright", "XML", "Pandas"],
    status: "Case técnico"
  },
  {
    title: "Dashboards e Integrações",
    category: "Dados e APIs",
    problem: "Informações dispersas, consolidações manuais e pouca visibilidade gerencial.",
    solution: "Integração de fontes, tratamento de dados e construção de indicadores para acompanhamento do negócio.",
    technologies: ["Power BI", "Power Query", "SQL", "Python"],
    status: "Portfólio"
  }
] as const;

export const workflow = [
  ["01", "Entendimento", "Análise do problema e do processo atual."],
  ["02", "Planejamento", "Definição da solução, arquitetura e tecnologias."],
  ["03", "Desenvolvimento", "Construção da automação, sistema ou integração."],
  ["04", "Testes", "Validação técnica, funcional e de cenários críticos."],
  ["05", "Implantação", "Deploy, configuração e entrada em produção."],
  ["06", "Evolução", "Monitoramento, manutenção e melhorias contínuas."]
] as const;

export const technologies = {
  Backend: ["Python", "Django", "FastAPI", "REST APIs"],
  Automação: ["Python", "Playwright", "Selenium", "Requests"],
  Dados: ["Pandas", "SQL", "Power BI", "Power Query", "Excel"],
  "Engenharia de Dados": ["Apache Airflow", "Apache Spark", "ETL", "Pipelines"],
  "Bancos de Dados": ["PostgreSQL", "SQL Server", "Supabase"],
  "Inteligência Artificial": ["OpenAI", "LLMs", "Agentes de IA", "APIs de IA"],
  Infraestrutura: ["Docker", "Git", "GitHub", "CI/CD", "Cloud"]
} as const;

export const differentiators = [
  ["Soluções personalizadas", "Cada projeto é construído conforme a necessidade real da empresa."],
  ["Visão de processo", "Antes de automatizar, o processo é entendido e estruturado."],
  ["Tecnologia adequada", "A ferramenta é escolhida pela necessidade, não pelo modismo."],
  ["Escalabilidade", "A solução é pensada para evoluir sem virar um gargalo."],
  ["Manutenção", "Possibilidade de acompanhamento, suporte e evolução contínua."]
] as const;

export const automationFlow = ["Processo manual", "Análise", "Automação", "Monitoramento", "Resultado"] as const;

export const automationBenefits = ["Menos trabalho manual", "Menos erros", "Mais produtividade", "Padronização", "Rastreabilidade", "Escalabilidade"] as const;

export const techVisual = [
  { label: "Python", icon: Braces },
  { label: "APIs", icon: GitBranch },
  { label: "Dados", icon: Database },
  { label: "IA", icon: Sparkles }
] as const;
