# SPEC — JHConsulting

Especificação viva do site institucional e portfólio da JHConsulting. Esta pasta é o ponto de entrada para entender o projeto: o que ele é, como está construído, como configurar, quais decisões foram tomadas, **o que já está pronto e o que falta**.

Data da última revisão: **28/09/2026** (fim da Fase 21). **Todas as fases concluídas**; o que resta são as ações listadas em [07-PENDENCIAS.md](07-PENDENCIAS.md) e o deploy, que depende de autorização.

## Índice

| Arquivo | Para que serve |
|---|---|
| [01-VISAO-GERAL.md](01-VISAO-GERAL.md) | O que é o site, objetivo, quem usa, o fluxo de ponta a ponta |
| [02-ARQUITETURA.md](02-ARQUITETURA.md) | Stack, estrutura de pastas, camadas e como uma página é renderizada |
| [03-CONFIGURACAO.md](03-CONFIGURACAO.md) | Supabase, variáveis de ambiente, comandos, como rodar e operar |
| [04-BANCO-E-SEGURANCA.md](04-BANCO-E-SEGURANCA.md) | Modelo de dados, RLS, funções e o modelo de ameaças assumido |
| [05-ESTRATEGIAS.md](05-ESTRATEGIAS.md) | Decisões de engenharia e por quê: cache, fonte de verdade, uploads, testes, migrations |
| [06-FEITO.md](06-FEITO.md) | O que já está implementado, fase por fase, com evidências |
| [07-PENDENCIAS.md](07-PENDENCIAS.md) | O que falta (Fase 21), ações do usuário e dívida técnica |

## Estado em uma frase

O site continua sendo o Next.js original, agora com painel administrativo protegido em `/admin`, e **projetos, serviços, tecnologias e informações institucionais vindo do Supabase Cloud** — editáveis sem alterar código e sem novo deploy. Os contatos do formulário têm persistência e painel de atendimento prontos; falta apenas configurar a `SUPABASE_SECRET_KEY` para que a gravação entre em operação.

## Regras permanentes do projeto

Estas restrições valem para qualquer pessoa ou agente que continuar o trabalho:

1. **Um único projeto Supabase**: `jhconsulting-site` (ref `qlgxzpowqijcvnwuqchh`). Nunca criar outro.
2. **Sem Docker, sem Supabase local, sem banco local.** Todo o banco é Supabase Cloud.
3. **Não recriar o site.** O Next.js existente é a base; a evolução é incremental e preserva a identidade visual.
4. **Nunca versionar segredos.** `SUPABASE_SECRET_KEY` e afins só no servidor, nunca com prefixo `NEXT_PUBLIC_`.
5. **Uma fase por vez**, com validação, testes e relatório antes de seguir.
6. **Migrations aplicadas pelo conector Supabase** e espelhadas em `supabase/migrations/` com a mesma versão.
7. **RLS nunca é desligado** como solução.

## Relação com a pasta `docs/`

`SPEC/` é a visão consolidada e de alto nível. `docs/` guarda o detalhe técnico e o histórico:

| Documento | Conteúdo |
|---|---|
| `docs/DATABASE.md` | Schema, grants, policies e funções, tabela por tabela |
| `docs/ADMIN-ARCHITECTURE.md` | Auth, autorização e cada CRUD do painel |
| `docs/PUBLIC-PROJECTS.md` | Rotas públicas, cache e revalidação |
| `docs/SITE-SETTINGS.md` | Configurações do site e seus consumidores |
| `README.md` ("Produção futura") | Como publicar no Render, variáveis e o que falta |
| `docs/HANDOFF-CODEX-CLOUD.md` | **Histórico.** Auditoria inicial e diário das fases até a 12 |
| `docs/ADMIN-MIGRATION-DISCOVERY.md` | **Histórico.** Discovery do código original (Fase 0) |
| `docs/SUPABASE-FOUNDATION.md` | **Histórico.** Relatório da criação do projeto Cloud (Fase 1) |

Os três últimos são fotografias de um momento: descrevem coisas como "ainda não existe" ou "na Fase N" que já mudaram. Cada um abre com um aviso nesse sentido. Quando `docs/` e `SPEC/` divergirem sobre o estado atual, **`SPEC/` é a fonte**.
