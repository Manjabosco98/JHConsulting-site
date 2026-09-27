# Banco de dados — Supabase Cloud

Projeto: **jhconsulting-site** · ref `qlgxzpowqijcvnwuqchh` · `sa-east-1` · PostgreSQL 17.
Fonte da verdade: o banco Cloud. Os arquivos em `supabase/migrations/` espelham o histórico aplicado, com as mesmas versões.

## Migrations aplicadas

| Versão | Nome | Conteúdo |
|---|---|---|
| 20260927140840 | `foundation_security_defaults` | revoga SELECT/INSERT/UPDATE/DELETE dos defaults de `public` |
| 20260927140921 | `content_model_rls` | schema de domínio, triggers, índices, grants, RLS e policies |
| 20260927141007 | `harden_public_default_privileges` | revoga **todos** os defaults restantes (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN, UPDATE em sequências) |

Processo para novas migrations: aplicar pelo conector (`apply_migration`), consultar `list_migrations` e salvar o arquivo local como `<versão>_<nome>.sql` com o mesmo SQL. Toda tabela nova em `public` nasce **sem privilégios** para `anon`/`authenticated`/`service_role`: conceder explicitamente e habilitar RLS na mesma migration.

## Tabelas

| Tabela | Chave | Observações |
|---|---|---|
| `projects` | uuid | `slug` único (kebab-case), `status` = rótulo editorial, `published` + `published_at` (preenchido automaticamente), `archived_at` (arquivado não pode estar publicado), `featured`, `display_order`, URLs validadas `http(s)://` |
| `technologies` | uuid | `slug` único, `icon`, `active`, `display_order` |
| `project_technologies` | (project_id, technology_id) | cascade ao apagar projeto; **restrict** ao apagar tecnologia vinculada; `display_order` |
| `technology_groups` | uuid | agrupamento exibido na seção Tecnologias (Backend, Automação…) |
| `technology_group_members` | (group_id, technology_id) | N:N; uma tecnologia pode estar em vários grupos (ex.: Python) |
| `services` | uuid | `slug` único, `icon` (nome Lucide), `tech` (linha editorial do card), `active`, `display_order` |
| `site_settings` | smallint, sempre `1` | singleton; dados institucionais públicos (sem segredos) |
| `contacts` | uuid | `status` enum `contact_status` (NEW, CONTACTED, NEGOTIATING, CONVERTED, ARCHIVED), `source` default `SITE`; limites iguais ao Zod do formulário |
| `private.admin_users` | user_id → `auth.users` | lista de administradores; fora da Data API |

Extensões ao modelo do briefing: `technology_groups`/`members`, `projects.archived_at`, `display_order` em tecnologias e vínculos, `services.tech`, `site_settings.bio` e `profile_image`.

Triggers: `touch_updated_at` (todas as tabelas com `updated_at`; preserva `created_at`) e `prepare_project_publication`. Funções em `private`, `search_path = ''`.

Índices: ordem pública de projetos/serviços/tecnologias/grupos (parciais), `projects.updated_at`, FKs reversas das tabelas de vínculo, contatos por `(status, created_at)` e `created_at`.

## Privilégios (grants efetivos)

| Role | Conteúdo público* | `site_settings` | `contacts` | `private` |
|---|---|---|---|---|
| `anon` | SELECT | SELECT | nenhum | nenhum |
| `authenticated` | SELECT, INSERT, UPDATE, DELETE | SELECT, INSERT, UPDATE | SELECT, UPDATE(status) | USAGE; EXECUTE `is_admin()` |
| `service_role` | nenhum | nenhum | INSERT (colunas do formulário), SELECT(id) | nenhum |

\* `projects`, `services`, `technologies`, `project_technologies`, `technology_groups`, `technology_group_members`.

Grants só definem o teto; o acesso a linhas é decidido pelo RLS.

## RLS

RLS habilitado em todas as tabelas.

- **Leitura pública** (`anon`, `authenticated`): projetos publicados e não arquivados; serviços, tecnologias e grupos ativos; vínculos só quando os dois lados são visíveis; `site_settings` id 1.
- **Admin** (`authenticated` + `private.is_admin()`): gerencia todo o conteúdo e `site_settings`; lê contatos e altera apenas `status`.
- **Contatos**: nenhum acesso público. A inserção será feita pelo endpoint do servidor (Fase 13).
- `private.admin_users`: sem policies (negação total pela API), consultada apenas por `is_admin()` (SECURITY DEFINER).

Os testes de acesso por role (anon / authenticated / admin) pertencem à Fase 3.

## Advisors (após a Fase 2)

- Segurança: apenas INFO `rls_enabled_no_policy` em `private.admin_users`. É intencional.
- Performance: WARN `multiple_permissive_policies` (SELECT de `authenticated`: policy pública + policy admin) em 7 tabelas, a revisar na Fase 3; INFO `unused_index` (banco ainda vazio).

## Tipos

`src/types/database.ts` é gerado do schema Cloud (conector `generate_typescript_types` ou `npm run supabase:types`). Regerar após qualquer alteração de schema.
