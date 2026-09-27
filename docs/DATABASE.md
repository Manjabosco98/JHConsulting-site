# Banco de dados — Supabase Cloud

Projeto: **jhconsulting-site** · ref `qlgxzpowqijcvnwuqchh` · `sa-east-1` · PostgreSQL 17.
Fonte da verdade: o banco Cloud. Os arquivos em `supabase/migrations/` espelham o histórico aplicado, com as mesmas versões.

## Migrations aplicadas

| Versão | Nome | Conteúdo |
|---|---|---|
| 20260927140840 | `foundation_security_defaults` | revoga SELECT/INSERT/UPDATE/DELETE dos defaults de `public` |
| 20260927140921 | `content_model_rls` | schema de domínio, triggers, índices, grants, RLS e policies |
| 20260927141007 | `harden_public_default_privileges` | revoga **todos** os defaults restantes (TRUNCATE, REFERENCES, TRIGGER, MAINTAIN, UPDATE em sequências) |
| 20260927141756 | `rls_split_policies` | uma policy permissiva por (tabela, role, ação); mesma semântica |
| 20260927142358 | `seed_initial_content` | conteúdo inicial migrado de `src/constants` (idempotente) |
| 20260927145124 | `auth_is_admin_rpc` | `public.is_admin()`: RPC sem parâmetros para o servidor verificar o próprio usuário; só `authenticated` |

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

RLS habilitado em todas as tabelas. Há exatamente uma policy permissiva por (tabela, role, ação); nomes no padrão `<tabela>_<ação>_<quem>`.

| Tabela | anon SELECT | authenticated SELECT | INSERT / UPDATE / DELETE (authenticated) |
|---|---|---|---|
| `projects` | publicado e não arquivado | público **ou** admin | admin |
| `services`, `technologies`, `technology_groups` | `active` | `active` **ou** admin | admin |
| `project_technologies` | projeto público e tecnologia ativa | idem **ou** admin | admin |
| `technology_group_members` | grupo e tecnologia ativos | idem **ou** admin | admin |
| `site_settings` | `id = 1` | `id = 1` | INSERT/UPDATE admin; DELETE sem grant |
| `contacts` | sem grant | admin | UPDATE só da coluna `status`, admin; INSERT/DELETE sem grant |

- **Admin** = `authenticated` com `private.is_admin()`: usuário em `private.admin_users` com `active = true`. Admin inativo é tratado como usuário comum.
- **Usuário autenticado sem admin**: mesmo acesso de leitura que o público; toda escrita é negada (INSERT falha com 42501; UPDATE e DELETE afetam 0 linhas).
- **Contatos**: nenhum acesso público. A inserção será feita pelo endpoint do servidor com `service_role` (Fase 13), limitada às colunas do formulário.
- `private.admin_users`: sem policies (negação total pela API), inacessível até para admins via API; consultada apenas por `is_admin()` (SECURITY DEFINER). Admins são cadastrados via SQL/conector (Fase 5).
- `is_admin()` é chamado como `(select private.is_admin())` e avaliado uma vez por query (initPlan).
- `public.is_admin()` (Fase 5) expõe o mesmo resultado via RPC para o servidor Next.js (`requireAdmin`). É SECURITY INVOKER, sem parâmetros (só responde sobre `auth.uid()`), com EXECUTE apenas para `authenticated`; anon recebe 42501. Detalhes em [ADMIN-ARCHITECTURE.md](ADMIN-ARCHITECTURE.md).

### Testes de acesso

[`supabase/tests/rls_matrix.sql`](../supabase/tests/rls_matrix.sql): 67 casos cobrindo anon, usuário comum, admin inativo, admin e service_role (leitura filtrada, escrita, TRUNCATE, colunas de contatos, escalonamento via `admin_users`, schema `private`). Executar pelo conector (`execute_sql`); cria fixtures, simula cada role com `SET LOCAL ROLE` + `request.jwt.claims` e termina com `RAISE`, então a transação sempre é desfeita. Resultado esperado: `RLS_MATRIX pass=67 fail=0`. Executar após qualquer mudança de grants, policies ou schema.

## Advisors (após a Fase 3)

- Segurança: apenas INFO `rls_enabled_no_policy` em `private.admin_users`. É intencional.
- Performance: somente INFO `unused_index` (banco sem dados reais).

## Conteúdo inicial (Fase 4)

Migration `seed_initial_content`, idempotente: chaves naturais (`slug`, `id = 1`) com `ON CONFLICT DO NOTHING`, então reexecutar não duplica nem sobrescreve edições do admin. Os vínculos são resolvidos por slug, sem UUIDs fixos.

| Origem | Destino | Registros |
|---|---|---:|
| `content.ts` → `services` | `services` (icon = nome do export Lucide) | 8 |
| `content.ts` → `technologies` + tecnologias dos projetos | `technologies` | 32 (28 do catálogo + Next.js, APIs, Resend, XML) |
| `content.ts` → chaves de `technologies` | `technology_groups` | 7 |
| `content.ts` → itens por grupo | `technology_group_members` | 29 (Python em 2 grupos) |
| `content.ts` → `projects` | `projects` (publicados; `status` = rótulo editorial) | 3 |
| `content.ts` → `projects[].technologies` | `project_technologies` | 12 |
| `site.ts` + parágrafos de `About.tsx` | `site_settings` (bio) | 1 |

- Ordem (`display_order`) = ordem atual do site.
- Não inventados: descrição longa, capa e links dos projetos; `featured = false`.
- E-mail, telefone, WhatsApp, LinkedIn, GitHub, Instagram e foto ficaram `NULL`, porque hoje são placeholders de ambiente. Serão preenchidos pelo admin (Fase 12).
- Validação: comparação campo a campo pela API pública (chave publishable) contra as constants, com ordem, textos, ícones (mesmo componente Lucide), grupos, vínculos, settings e bio (todos PASS); reexecução em transação desfeita sem nenhuma alteração; `rls_matrix.sql` 67/67 com dados reais.
- As constants continuam sendo a fonte do site até as fases de integração (9–12); a remoção só acontece na Fase 14.

## Tipos

`src/types/database.ts` é gerado do schema Cloud (conector `generate_typescript_types` ou `npm run supabase:types`). Regerar após qualquer alteração de schema.
