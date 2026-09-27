# HANDOFF CODEX → CLOUD — FASE H0

Data: 27/09/2026 (~11:00 BRT). Escopo: auditoria do estado deixado pelo agente anterior (Codex). **Nenhuma implementação nova, nenhuma migration aplicada, nenhum recurso Cloud criado ou alterado.** Única alteração no projeto: este documento.

Fontes de verdade: arquivos em disco + consultas ao Supabase Cloud pelo conector + execução real de lint/testes/build + teste de conectividade com as chaves públicas do `.env.local`.

---

## 1. Último estado conhecido

| Fase (numeração atual) | Estado real |
|---|---|
| Fase 0 — Discovery | **CONCLUÍDO** (`docs/ADMIN-MIGRATION-DISCOVERY.md`) |
| Fase 1 — Integração Supabase | **CONCLUÍDO na prática** (validado nesta auditoria); documentação da fase desatualizada |
| Fase 2 — Schema Cloud | **PARCIAL**: SQL escrito em disco, **nada aplicado no Cloud** |
| Fase 3 — RLS | **PARCIAL**: policies escritas no mesmo SQL, **nada aplicado** |
| Fases 4 a 21 | **NÃO INICIADO** |

O documento `docs/SUPABASE-FOUNDATION.md` termina em "BLOCKED, aguardando escolha da organização". Esse estado **foi superado**: o projeto Cloud existe e o `.env.local` foi configurado depois. O Codex atingiu o limite antes de atualizar o relatório da Fase 1.

## 2. Alterações existentes / Git

- `git status`, `git branch`, `git log`, `git diff`: **falham — a pasta não é repositório Git** (nem ancestrais). Não há histórico, autoria nem diff. A reconstrução abaixo usa datas de modificação dos arquivos.
- Nenhuma alteração não commitada foi descartada (não há Git para isso).

## 3. Arquivos criados/modificados pelo Codex (por data)

| Data (BRT) | Arquivo | Natureza |
|---|---|---|
| 05/09 | `src/app/**`, `src/components/**`, `src/constants/**`, configs | site original — **não tocado** |
| 26/09 17:51 | `supabase/migrations/20260926205147_foundation_security_defaults.sql` | **0 bytes** (duplicata vazia) |
| 26/09 17:55 | `supabase/migrations/20260926205118_foundation_security_defaults.sql` | revoga default privileges |
| 26/09 17:55 | `supabase/config.toml`, `supabase/seed.sql`, `.gitignore` | legado de Supabase **local** |
| 26/09 18:31 | `src/lib/supabase/client.ts`, `src/types/database.ts` | cliente browser, tipos base vazios |
| 26/09 18:41 | `package-lock.json` | dependências Supabase |
| 27/09 09:58 | `supabase/migrations/20260927125635_content_model_rls.sql` | schema de domínio + RLS |
| 27/09 10:26 | `docs/ADMIN-MIGRATION-DISCOVERY.md` | relatório Fase 0 |
| 27/09 10:29 | `package.json`, `.env.example`, `src/lib/supabase/{env,server}.ts`, `scripts/generate-supabase-types.mjs`, `tests/*.test.mjs` | ajustes Fase 1 (Cloud only) |
| 27/09 10:30–10:31 | `README.md`, `docs/SUPABASE-FOUNDATION.md` | docs Fase 1 (desatualizada) |
| 27/09 10:36 | `.env.local` | configurado com o projeto Cloud correto |

Não existem: `middleware.ts`, `proxy.ts`, `src/app/admin/`, `src/app/(admin)/`, repositories, `src/app/projetos/`.

Artefato externo: cópia de validação do Codex em `C:\Users\manja\AppData\Local\Temp\jhconsulting-discovery-4e6a3d3d2531487d9c02a068ccfa75b1` (com `node_modules`). Foi reutilizada nesta auditoria para não instalar dependências dentro da pasta sincronizada pelo Google Drive.

## 4. Projeto Supabase encontrado

`list_projects` retorna **um único projeto** — é o da JHConsulting e deve ser usado em todas as fases:

| Campo | Valor |
|---|---|
| Nome | `jhconsulting-site` |
| Project ref | `qlgxzpowqijcvnwuqchh` |
| URL da API | `https://qlgxzpowqijcvnwuqchh.supabase.co` |
| Organização | `ovrzfpufbbfktbekmesd` (Manjabosco) |
| Região | `sa-east-1` (São Paulo) |
| Status | `ACTIVE_HEALTHY` |
| PostgreSQL | 17.6.1.166 (canal GA) |
| Criado em | 27/09/2026 10:54 UTC |

**Não criar outro projeto.**

## 5. Schema atual do Supabase Cloud

Consultado via `list_tables`, `list_migrations` e SQL de catálogo:

- Schemas: `auth`, `extensions`, `graphql`, `graphql_public`, `public`, `realtime`, `storage`, `vault` (padrão). **Não existe schema `private`.**
- `public`: **nenhuma tabela, enum ou função**.
- Migrations registradas no Cloud: **nenhuma** (`supabase_migrations.schema_migrations` nem existe).
- Policies em `public`/`storage`: **0**.
- Security advisors: nenhum alerta (esperado, banco vazio).
- **Default privileges em `public` continuam os padrões do Supabase**: `anon` e `authenticated` recebem todos os privilégios em tabelas, sequências e funções criadas por `postgres`. A migration de fundação que revoga isso **não foi aplicada**. Consequência: qualquer tabela criada no Cloud sem REVOKE explícito fica exposta via Data API.
- Teste REST com a chave pública: `PGRST205 Could not find the table 'public.projects'` — confirma schema vazio.

## 6. Migrations encontradas (em disco)

| Arquivo | Conteúdo | Aplicada no Cloud? | Recomendação |
|---|---|---|---|
| `20260926205118_foundation_security_defaults.sql` | revoga default privileges (tabelas/sequências/funções) de anon/authenticated/service_role em `public` | **Não** | aplicar primeiro na Fase 2 |
| `20260926205147_foundation_security_defaults.sql` | **vazio (0 bytes)**, mesmo nome da anterior | **Não** | remover na Fase 2, com autorização |
| `20260927125635_content_model_rls.sql` | schema completo + triggers + índices + grants + RLS + policies | **Não** | revisar e aplicar (Fase 2/3) |

Resumo do SQL de domínio (bem construído, pronto para revisão final):

- Tabelas: `projects`, `technologies`, `project_technologies`, `technology_groups`, `technology_group_members`, `services`, `site_settings` (singleton `id = 1`), `contacts`; `private.admin_users`.
- Enum `contact_status` (NEW, CONTACTED, NEGOTIATING, CONVERTED, ARCHIVED).
- Checks de tamanho, slug, URL, e-mail; `projects_publication_date`; triggers `touch_updated_at` e `prepare_project_publication`.
- Autorização: `private.is_admin()` SECURITY DEFINER, `search_path = ''`, EXECUTE só para `authenticated`.
- RLS habilitado em todas as tabelas; leitura pública só de publicado/ativo; admin via `is_admin()`; contatos sem acesso público, admin só lê e altera `status`; `service_role` só INSERT de colunas do formulário.

Extensões em relação ao modelo do briefing (justificadas): `technology_groups`/`members` (Python está em dois grupos no site), `projects.archived_at`, `display_order` em tecnologias e vínculos, `services.tech` (linha editorial dos cards), `site_settings.bio` e `profile_image`.

Pontos de revisão antes de aplicar:

1. O arquivo mistura schema (Fase 2) e RLS (Fase 3). Como RLS é habilitado no mesmo arquivo, não há janela de exposição; decidir na Fase 2 se aplica junto ou separa.
2. A foundation deve preceder o SQL de domínio no Cloud (default privileges atuais são permissivos).
3. O arquivo usa `begin; ... commit;` — `apply_migration` já roda em transação; validar compatibilidade.
4. Comentários referenciam numeração antiga de fases (ex.: "phase 6" para Storage, "phase 11" para contatos).

## 7. Dependências instaladas

`package.json` contém (fixadas):

- `@supabase/supabase-js` **2.117.2**
- `@supabase/ssr` **0.12.7**
- `client-only` / `server-only` 0.0.1
- `supabase` (CLI, dev) **2.118.0**

Stack preservada: Next 16.3.3, React ^19.2, Tailwind ^4.3, Motion ^12, Lucide ^0.468, Zod ^4, Resend ^6. Compatível com Node ≥ 22 (ambiente: Node 24.20.0, npm 11.19.0). `npm install` não alterou o lockfile. Sem `engines`/`.nvmrc`.

## 8. Configuração Supabase existente no código

| Item | Estado |
|---|---|
| `src/lib/supabase/env.ts` | valida lazy via Zod: URL HTTPS + chave `sb_publishable_…`; erro não vaza valores |
| `src/lib/supabase/client.ts` | `client-only`, `createBrowserClient<Database>` com chave pública |
| `src/lib/supabase/server.ts` | `server-only`, `createServerClient` por requisição com `cookies()`; sem secret |
| `src/types/database.ts` | tipos base **vazios** — gerar após a Fase 2 |
| `scripts/generate-supabase-types.mjs` | já corrigido para `--project-id` (sem `--local`) |
| Consumidores | **nenhum** — páginas/API ainda não usam Supabase |

Variáveis: o projeto usa a nomenclatura moderna `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` no lugar de `ANON_KEY` / `SERVICE_ROLE_KEY`. É equivalente e não precisa ser renomeada. Não existe nenhuma variável `NEXT_PUBLIC_*SERVICE_ROLE*` / `NEXT_PUBLIC_*SECRET*`.

`.env.local` (somente presença; valores não exibidos):

| Variável | Estado |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | definida, aponta para `qlgxzpowqijcvnwuqchh` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | definida, formato `sb_publishable_` válido |
| `SUPABASE_PROJECT_ID` | definida, ref correto |
| `NEXT_PUBLIC_SITE_URL` | definida (localhost) |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` | **vazias** |
| `SUPABASE_SECRET_KEY` | ausente (correto: ainda não usada) |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`, `…CONTACT_EMAIL`, `…LINKEDIN_URL`, `…GITHUB_URL` | ausentes → site mostra placeholders `[WHATSAPP]` etc. |

**Conectividade real validada** (chave pública, somente leitura): `auth/v1/health` 200; `auth/v1/settings` 200; `storage.listBuckets()` ok (0); REST responde (PGRST205, tabela inexistente).

## 9. Auth existente

- Cloud: provedor **email** ativo; `mailer_autoconfirm = false`; **`disable_signup = false` (cadastro público aberto)**; 0 usuários.
- Código: nenhum login, logout, proxy de sessão ou proteção de rota.
- `supabase/config.toml` (local, 127.0.0.1) não tem efeito no Cloud.
- Status: **NÃO INICIADO** (além do default do projeto).

## 10. Storage existente

- 0 buckets, 0 objetos, 0 policies em `storage.objects`. Bucket `portfolio` **não existe**.
- Status: **NÃO INICIADO**.

## 11. Admin existente

Nenhuma rota, layout ou componente admin. `/admin` responde 404. **NÃO INICIADO.**

## 12. Conteúdo já migrado

**Nenhum.** O banco não tem tabelas; `supabase/seed.sql` contém apenas comentários.

## 13. Conteúdo ainda hardcoded

`src/constants/content.ts`:

| Constante | Itens | Destino previsto |
|---|---:|---|
| `services` | 8 (título, descrição, ícone Lucide, linha `tech`) | `services` |
| `projects` | 3 (SGECHAT; Automação Fiscal / NFS-e; Dashboards e Integrações) | `projects` + `project_technologies` |
| `technologies` | 7 grupos, 29 ocorrências, 28 nomes (32 somando os dos projetos) | `technologies` + `technology_groups` |
| `authority`, `problems`, `solutions`, `workflow`, `differentiators`, `automationFlow`, `automationBenefits` | editoriais | permanecem no código (fora do escopo admin) |
| `techVisual` | 4 | sem consumidor; avaliar na limpeza |

`src/constants/site.ts` (`siteConfig`): nome da empresa, profissional, cargo, descrição, localização, área de atendimento (fixos) e e-mail, WhatsApp, LinkedIn, GitHub, Instagram (via env com placeholders) → `site_settings`. `nav` e `whatsappHref` permanecem no código.

Há também texto institucional fora das constantes (Hero, About, Footer, JSON-LD em `page.tsx`, metadata em `layout.tsx`), mapeado no discovery, seção 4.

## 14. Matriz Código × Cloud

| Recurso | Código | Cloud | Status | Ação recomendada |
|---|---|---|---|---|
| Projeto Supabase | `.env.local` aponta para o ref correto | `jhconsulting-site`, ACTIVE_HEALTHY, sa-east-1 | **CONCLUÍDO** | reutilizar sempre |
| Dependências | supabase-js 2.117.2, ssr 0.12.7 | — | **CONCLUÍDO** | nenhuma |
| Browser/server client | separados, só chave pública | conexão validada | **CONCLUÍDO** | nenhuma |
| Env | `.env.example` completo; `.env.local` Supabase OK | — | **CONCLUÍDO** (Resend vazio) | preencher Resend na Fase 13 |
| Docs Fase 1 | diz BLOCKED | projeto existe | **PRECISA AJUSTE** | atualizar `SUPABASE-FOUNDATION.md` |
| Foundation default privileges | migration existe | **não aplicada**; defaults permissivos | **PENDENTE** | aplicar na Fase 2, antes do domínio |
| Migration vazia `…205147` | 0 bytes | — | **INCORRETO** | remover na Fase 2 |
| Tabelas de domínio (8 + admin_users) | SQL completo | **não existem** | **PARCIAL** | Fase 2 |
| FKs / constraints / índices | no SQL | não existem | **PARCIAL** | Fase 2 |
| RLS / policies | no SQL | 0 policies | **PARCIAL** | Fase 3 (ou junto à 2) |
| Tipos TS | base vazia | — | **PENDENTE** | gerar via conector após Fase 2 |
| Seed de conteúdo | só comentários | vazio | **NÃO INICIADO** | Fase 4 |
| Auth | nenhum | email on, **signup aberto**, 0 usuários | **NÃO INICIADO** | Fase 5; desabilitar signup público |
| Proxy de sessão | não existe | — | **NÃO INICIADO** | Fase 5 |
| Storage `portfolio` | não referenciado | 0 buckets | **NÃO INICIADO** | Fase 8 |
| Admin | não existe | — | **NÃO INICIADO** | Fase 6 |
| Repositories | não existem | — | **NÃO INICIADO** | Fases 7+ |
| Contatos persistidos | só Resend | tabela não existe | **NÃO INICIADO** | Fase 13 |
| `supabase/config.toml` | config local legada | sem efeito | **PRECISA AJUSTE** | limpeza (Fase 19) |

## 15. Qualidade atual (executado nesta auditoria)

Executado na cópia temporária espelhada (`robocopy /MIR`, excluindo `node_modules` e `.next`), para não sincronizar `node_modules` no Google Drive.

| Check | Resultado |
|---|---|
| `npm install` | PASS; lockfile idêntico ao original; aviso de postinstall `unrs-resolver` não aprovado (sem impacto) |
| `npm run lint` | **PASS**: 0 erros, 1 warning preexistente (`postcss.config.mjs`, export anônimo) |
| `npm test` | **PASS**: 13/13 |
| `npm run build` | **PASS**: Next 16.3.3; `/`, `/robots.txt`, `/sitemap.xml` estáticos; `/api/contact` dinâmica |
| `npm run typecheck` | **PASS** |
| Conectividade Cloud | **PASS** (auth health, settings, storage, REST) |

## 16. Riscos

1. **Default privileges permissivos no Cloud**: criar qualquer tabela em `public` sem REVOKE explícito a expõe a `anon`. Aplicar a foundation antes de qualquer DDL.
2. **Signup público habilitado**: qualquer pessoa pode criar conta. O modelo `private.admin_users` impede acesso a dados, mas o signup deve ser desativado no painel (Auth → Sign In / Providers) antes de ir para produção.
3. **Sem Git**: nenhuma forma de reverter mudanças ou auditar histórico. Recomendado `git init` + commit baseline antes da Fase 2 (requer autorização).
4. **Formulário de contato** (preexistente, discovery §5): falso erro após sucesso (`e.currentTarget.reset()` após `await`), JSON malformado retorna 500, exceção do SDK Resend sem catch.
5. Resend sem credenciais em `.env.local`: o contato responde 503 localmente.

## 17. Inconsistências

- `docs/SUPABASE-FOUNDATION.md` afirma que `list_projects` estava vazio e o projeto não foi criado; o Cloud mostra o projeto criado em 27/09 10:54 UTC (07:54 BRT), e o documento foi gravado às 10:31 BRT. Sem Git não é possível reconstruir a ordem real. O fato verificável é que o projeto existe e o `.env.local` aponta corretamente para ele.
- Discovery (§7) diz que o gerador de tipos usa `--local`; o script atual já usa `--project-id` (corrigido depois, na Fase 1).
- Comentários em SQL, seed e `server.ts` usam numeração antiga de fases.
- `seed.sql` menciona `supabase db reset` (fluxo local proibido).
- Duas migrations com o mesmo nome lógico, sendo uma vazia.

## 18. Dívida técnica

- Warning ESLint em `postcss.config.mjs`.
- `techVisual` sem consumidor.
- Rate limit em memória por processo, sem limpeza (Fases 13/18).
- Sem `engines`/`.nvmrc` para o Render (Fase 21).
- Sem Turnstile (variáveis existem, sem uso).
- `supabase/config.toml` e `.temp` legados.
- Testes cobrem apenas factories e gerador de tipos, sem fluxos funcionais.

## 19. Próxima fase recomendada

A **Fase 1 está concluída na prática** (dependências, clientes, env e conexão real validados nesta auditoria). Resta apenas atualizar `docs/SUPABASE-FOUNDATION.md`, o que pode abrir a próxima fase sem retrabalho.

**Primeira fase realmente incompleta: FASE 2 — SCHEMA CLOUD**, começando por:

1. (recomendado, com autorização) `git init` + commit baseline;
2. atualizar `SUPABASE-FOUNDATION.md` para PASS;
3. remover a migration vazia `20260926205147_…`;
4. aplicar via conector `foundation_security_defaults`;
5. revisar e aplicar o SQL de domínio (decidindo se RLS/policies vão juntos ou na Fase 3);
6. reconsultar schema, grants e advisors;
7. gerar `src/types/database.ts` via conector.

Aguardando autorização.

---

## Atualização — Fase 2 concluída (27/09/2026)

Migrations aplicadas no Cloud: `foundation_security_defaults`, `content_model_rls` e a correção `harden_public_default_privileges`. A migration vazia foi removida, os arquivos locais foram renomeados para as versões do Cloud, os tipos foram gerados e o Git foi inicializado. Detalhes em [DATABASE.md](DATABASE.md). Próxima: **Fase 3 — RLS** (testes por role e revisão de `multiple_permissive_policies`).

## Atualização — Fase 3 concluída (27/09/2026)

Policies refatoradas (`rls_split_policies`) para eliminar `multiple_permissive_policies`, sem mudança de semântica. A matriz `supabase/tests/rls_matrix.sql` passou 67/67 antes e depois. Próxima: **Fase 4 — seed e migração de conteúdo**.

## Atualização — Fase 4 concluída (27/09/2026)

Conteúdo de `src/constants` migrado pela migration `seed_initial_content` (idempotente): 8 serviços, 32 tecnologias, 7 grupos, 29 membros, 3 projetos, 12 vínculos e `site_settings`. Contatos públicos ficaram `NULL`. As constants foram mantidas. Próxima: **Fase 5 — Auth**.

## Atualização — Fase 5 concluída (27/09/2026)

Auth por e-mail + senha: `src/proxy.ts` (renovação de sessão e redirect otimista), `requireAdmin()` no servidor via RPC `public.is_admin()` (migration `auth_is_admin_rpc`), login/logout por Server Actions e `/admin` com noindex. Testes: 22 unitários e 21 E2E contra o Cloud (usuários temporários removidos). Pendências do usuário: criar a conta admin real e desativar o signup público no painel. Próxima: **Fase 6 — Admin base**.

## Atualização — Fase 6 concluída (27/09/2026)

Admin base: sidebar/header responsivos, dashboard com dados reais (`src/lib/repositories/dashboard.ts`), páginas placeholder protegidas para as 5 seções e `error.tsx`. Testes: 26 unitários e 32 E2E, com screenshots desktop/mobile verificados. Débito registrado: `font: inherit` fora de `@layer` em `globals.css`. Conta admin real ainda não criada. Próxima: **Fase 7 — CRUD de projetos**.

## Atualização — Fase 7 concluída (27/09/2026)

CRUD de projetos no painel (lista, filtros, busca, criar, editar, publicar/arquivar, tecnologias ordenadas, excluir). A gravação é atômica via RPC `admin_save_project` (migrations `admin_save_project` e `admin_save_project_optional_id`). Testes: 38 unitários, matriz RLS 73/73, E2E auth 32/32 e projetos 22/22. Próxima: **Fase 8 — Storage** (bucket `portfolio` e capa do projeto).

## Atualização — Fase 8 concluída (27/09/2026)

Bucket `portfolio` (público para leitura, 5 MiB, JPEG/PNG/WebP/AVIF) com escrita só para admin. Capa de projeto enviada por Server Action com validação por magic bytes, rollback em falha e remoção da imagem anterior; a exclusão do projeto limpa a pasta. `next/image` configurado para o Storage. Testes: 48 unitários, matriz RLS 82/82, E2E auth 32, projetos 22 e storage 23. Próxima: **Fase 9 — projetos públicos**.

## Atualização — Fase 9 concluída (27/09/2026)

Projetos públicos lendo do Supabase: seção da home (com fallback para constants), `/projetos` e `/projetos/[slug]` (SSG + on-demand), sitemap dinâmico. ISR 1h + `revalidatePath` on-demand nas escritas do admin (home, /projetos, detalhe e sitemap). Navbar com âncoras internas. Testes: 48 unitários e E2E auth 32, projetos 22, storage 23, público 19. Próxima: **Fase 10 — serviços**. Detalhes em docs/PUBLIC-PROJECTS.md.
