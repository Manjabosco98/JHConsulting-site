-- Fase 4: migração do conteúdo de src/constants (content.ts, site.ts e About.tsx)
-- para o Supabase Cloud. Idempotente: chaves naturais (slug / id=1) com
-- ON CONFLICT DO NOTHING — reexecutar não duplica nem sobrescreve edições do admin.
-- Vínculos resolvidos por slug (sem UUIDs fixos). Ordem = ordem atual no site.
-- Contatos públicos (e-mail, WhatsApp, redes) ficam NULL: hoje são placeholders
-- de ambiente; serão preenchidos pelo admin (Fase 12).

-- Serviços (content.ts → services). icon = nome do componente Lucide.
insert into public.services (slug, title, description, icon, tech, display_order) values
  ('automacao-de-processos', 'Automação de Processos', 'Automatize rotinas operacionais, administrativas, fiscais e financeiras com rastreabilidade e controle.', 'Bot', 'Python • Playwright • Selenium • APIs', 1),
  ('desenvolvimento-de-sistemas', 'Desenvolvimento de Sistemas', 'Sistemas internos, plataformas web, painéis administrativos e aplicações corporativas sob medida.', 'Layers3', 'Next.js • Python • Django • FastAPI', 2),
  ('apis-e-integracoes', 'APIs e Integrações', 'Conecte sistemas e elimine retrabalho com APIs REST, webhooks e serviços backend.', 'Network', 'REST • Webhooks • OAuth • Banco de Dados', 3),
  ('dashboards-e-dados', 'Dashboards e Dados', 'Transforme dados dispersos em indicadores e relatórios que apoiam decisões de negócio.', 'ChartNoAxesCombined', 'Power BI • Power Query • Excel • Python', 4),
  ('engenharia-de-dados', 'Engenharia de Dados', 'Pipelines, ETL/ELT, cargas automatizadas e integração entre fontes de dados.', 'Database', 'SQL • Airflow • Spark • ETL', 5),
  ('inteligencia-artificial', 'Inteligência Artificial', 'Agentes, chatbots, análise documental e automações com LLMs aplicadas ao negócio.', 'Sparkles', 'OpenAI • LLMs • Agentes • APIs de IA', 6),
  ('backend-e-arquitetura', 'Backend e Arquitetura', 'Serviços robustos, organização de regras de negócio, segurança e integração entre aplicações.', 'ServerCog', 'Python • FastAPI • PostgreSQL • Docker', 7),
  ('consultoria-tecnologica', 'Consultoria Tecnológica', 'Mapeamento do processo atual, identificação de gargalos e desenho da solução mais adequada.', 'FileCog', 'Processos • Arquitetura • Roadmap • Evolução', 8)
on conflict (slug) do nothing;

-- Tecnologias: 28 do catálogo agrupado + 4 citadas apenas nos projetos (32 nomes).
-- Ordem = primeira aparição no catálogo; as exclusivas dos projetos ao final.
insert into public.technologies (slug, name, display_order) values
  ('python', 'Python', 1), ('django', 'Django', 2), ('fastapi', 'FastAPI', 3), ('rest-apis', 'REST APIs', 4),
  ('playwright', 'Playwright', 5), ('selenium', 'Selenium', 6), ('requests', 'Requests', 7),
  ('pandas', 'Pandas', 8), ('sql', 'SQL', 9), ('power-bi', 'Power BI', 10), ('power-query', 'Power Query', 11), ('excel', 'Excel', 12),
  ('apache-airflow', 'Apache Airflow', 13), ('apache-spark', 'Apache Spark', 14), ('etl', 'ETL', 15), ('pipelines', 'Pipelines', 16),
  ('postgresql', 'PostgreSQL', 17), ('sql-server', 'SQL Server', 18), ('supabase', 'Supabase', 19),
  ('openai', 'OpenAI', 20), ('llms', 'LLMs', 21), ('agentes-de-ia', 'Agentes de IA', 22), ('apis-de-ia', 'APIs de IA', 23),
  ('docker', 'Docker', 24), ('git', 'Git', 25), ('github', 'GitHub', 26), ('ci-cd', 'CI/CD', 27), ('cloud', 'Cloud', 28),
  ('nextjs', 'Next.js', 29), ('apis', 'APIs', 30), ('resend', 'Resend', 31), ('xml', 'XML', 32)
on conflict (slug) do nothing;

-- Grupos da seção Tecnologias (content.ts → technologies), na ordem atual.
insert into public.technology_groups (slug, name, display_order) values
  ('backend', 'Backend', 1),
  ('automacao', 'Automação', 2),
  ('dados', 'Dados', 3),
  ('engenharia-de-dados', 'Engenharia de Dados', 4),
  ('bancos-de-dados', 'Bancos de Dados', 5),
  ('inteligencia-artificial', 'Inteligência Artificial', 6),
  ('infraestrutura', 'Infraestrutura', 7)
on conflict (slug) do nothing;

insert into public.technology_group_members (group_id, technology_id, display_order)
select g.id, t.id, m.ord
from (values
  ('backend', 'python', 1), ('backend', 'django', 2), ('backend', 'fastapi', 3), ('backend', 'rest-apis', 4),
  ('automacao', 'python', 1), ('automacao', 'playwright', 2), ('automacao', 'selenium', 3), ('automacao', 'requests', 4),
  ('dados', 'pandas', 1), ('dados', 'sql', 2), ('dados', 'power-bi', 3), ('dados', 'power-query', 4), ('dados', 'excel', 5),
  ('engenharia-de-dados', 'apache-airflow', 1), ('engenharia-de-dados', 'apache-spark', 2), ('engenharia-de-dados', 'etl', 3), ('engenharia-de-dados', 'pipelines', 4),
  ('bancos-de-dados', 'postgresql', 1), ('bancos-de-dados', 'sql-server', 2), ('bancos-de-dados', 'supabase', 3),
  ('inteligencia-artificial', 'openai', 1), ('inteligencia-artificial', 'llms', 2), ('inteligencia-artificial', 'agentes-de-ia', 3), ('inteligencia-artificial', 'apis-de-ia', 4),
  ('infraestrutura', 'docker', 1), ('infraestrutura', 'git', 2), ('infraestrutura', 'github', 3), ('infraestrutura', 'ci-cd', 4), ('infraestrutura', 'cloud', 5)
) as m(group_slug, tech_slug, ord)
join public.technology_groups g on g.slug = m.group_slug
join public.technologies t on t.slug = m.tech_slug
on conflict (group_id, technology_id) do nothing;

-- Projetos (content.ts → projects). Publicados, pois já são exibidos no site.
-- status = rótulo editorial atual. Sem descrição longa, capa ou links: não inventar.
insert into public.projects (slug, title, category, problem, solution, status, display_order, published) values
  ('sgechat', 'SGECHAT', 'Plataforma empresarial',
   'Centralizar comunicação, templates e fluxos operacionais em um ambiente único.',
   'Plataforma com chat, gestão de conversas, templates, emails, usuários, integrações e automações.',
   'Case em evolução', 1, true),
  ('automacao-fiscal-nfse', 'Automação Fiscal / NFS-e', 'Automação empresarial',
   'Rotinas repetitivas de consulta, download e estruturação de documentos fiscais.',
   'Automação de portais, leitura de XML e processamento estruturado de notas e documentos.',
   'Case técnico', 2, true),
  ('dashboards-e-integracoes', 'Dashboards e Integrações', 'Dados e APIs',
   'Informações dispersas, consolidações manuais e pouca visibilidade gerencial.',
   'Integração de fontes, tratamento de dados e construção de indicadores para acompanhamento do negócio.',
   'Portfólio', 3, true)
on conflict (slug) do nothing;

insert into public.project_technologies (project_id, technology_id, display_order)
select p.id, t.id, m.ord
from (values
  ('sgechat', 'nextjs', 1), ('sgechat', 'apis', 2), ('sgechat', 'supabase', 3), ('sgechat', 'resend', 4),
  ('automacao-fiscal-nfse', 'python', 1), ('automacao-fiscal-nfse', 'playwright', 2), ('automacao-fiscal-nfse', 'xml', 3), ('automacao-fiscal-nfse', 'pandas', 4),
  ('dashboards-e-integracoes', 'power-bi', 1), ('dashboards-e-integracoes', 'power-query', 2), ('dashboards-e-integracoes', 'sql', 3), ('dashboards-e-integracoes', 'python', 4)
) as m(project_slug, tech_slug, ord)
join public.projects p on p.slug = m.project_slug
join public.technologies t on t.slug = m.tech_slug
on conflict (project_id, technology_id) do nothing;

-- Configurações institucionais (site.ts → siteConfig; bio = parágrafos do About.tsx).
insert into public.site_settings (id, company_name, professional_name, role, description, bio, location, service_area) values (
  1,
  'JHConsulting',
  'João Henrique Manjabosco',
  'Analista de Sistemas • Desenvolvedor • Especialista em Automação',
  'Tecnologia, automação, sistemas, integrações e dados aplicados a problemas reais de negócios.',
  'João Henrique Manjabosco é Analista de Sistemas, formado em Sistemas de Informação, com atuação em automação, integração de sistemas, desenvolvimento backend e análise de dados.

Desenvolve ferramentas empresariais, APIs, dashboards e soluções personalizadas para otimização de processos. Pela JHConsulting, conecta tecnologia, dados e automação para resolver problemas reais dentro das empresas.

Também possui atuação e estudos em Ciência de Dados, Inteligência Artificial, Engenharia de Dados, Machine Learning e Arquitetura de Software.',
  'Goiânia, Goiás, Brasil',
  'Atendimento remoto para empresas em todo o Brasil'
)
on conflict (id) do nothing;
