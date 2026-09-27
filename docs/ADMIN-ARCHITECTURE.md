# Arquitetura do painel administrativo

## Autenticação e autorização (Fase 5)

Supabase Auth com **e-mail + senha**, sessão em cookies (`@supabase/ssr`) e autorização decidida pelo banco.

```text
Requisição /admin/*
   │
   ▼
src/proxy.ts ─── otimista: renova a sessão (cookies + Cache-Control no-store),
   │             sem sessão → 307 /admin/login; X-Robots-Tag noindex
   ▼
src/app/admin/(painel)/layout.tsx + page.tsx
   │   requireAdmin()  ← autorização real, no servidor
   ▼
src/lib/auth/admin.ts
   ├─ supabase.auth.getClaims()   valida o JWT
   └─ supabase.rpc("is_admin")    public.is_admin() → private.is_admin() → private.admin_users (active)
        não admin / erro → redirect /admin/login (fail closed)
```

| Arquivo | Papel |
|---|---|
| `src/proxy.ts` | Proxy do Next 16 (antigo middleware), com matcher só em `/admin`. O site público continua estático |
| `src/lib/auth/admin-routes.ts` | regra pura de redirecionamento do proxy (testada) |
| `src/lib/auth/admin.ts` | `getAuthState()` (anonymous / forbidden / admin, com `cache` por requisição) e `requireAdmin()` |
| `src/app/admin/actions.ts` | Server Actions `login` (Zod, mensagem genérica, 429 tratado; não-admin é deslogado na hora) e `logout` (`scope: local`) |
| `src/app/admin/login/` | página de login; conta sem permissão vê aviso e botão de sair |
| `src/app/admin/layout.tsx` | metadata `noindex, nofollow` para todo `/admin` |
| `src/app/admin/(painel)/` | área protegida: layout e páginas chamam `requireAdmin()` |

**Regras para as próximas fases**

- Toda página e **toda Server Action** administrativa chama `requireAdmin()`. Layouts não rodam de novo na navegação client-side, e Server Actions são endpoints públicos.
- As escritas usam o cliente de servidor com a sessão do usuário (`createClient()` de `src/lib/supabase/server.ts`). O RLS aplica `is_admin()` de novo no banco (defesa em profundidade). Não usar `service_role` no admin.
- O proxy nunca é a única barreira. `robots.txt` bloqueia `/admin`, mas isso não é controle de acesso.

## Layout e navegação (Fase 6)

```text
src/app/admin/
├── layout.tsx                 metadata noindex (todo /admin)
├── actions.ts                 login / logout
├── login/                     página pública de login
└── (painel)/                  área protegida (requireAdmin no layout e em cada página)
    ├── layout.tsx             sidebar (desktop) / navegação em linhas (mobile) + header com e-mail e Sair
    ├── error.tsx              erro amigável, sem detalhes do banco
    ├── page.tsx               /admin: dashboard
    ├── projetos/              CRUD (Fase 7): lista, novo/, [id]/, actions.ts
    ├── servicos/              CRUD (Fase 10): lista, novo/, [id]/, actions.ts
    ├── tecnologias/           placeholder → Fase 11
    ├── contatos/              placeholder → Fase 13
    └── configuracoes/         placeholder → Fase 12
```

| Peça | Arquivo |
|---|---|
| Itens e regra de item ativo | `src/lib/admin/navigation.ts` (`isActiveNav`) |
| Navegação (client, `usePathname`, `aria-current`) | `src/components/admin/AdminNav.tsx` |
| Cabeçalho de página / placeholder | `src/components/admin/AdminPageHeader.tsx`, `AdminPlaceholder.tsx` |
| Rótulos de status e datas (pt-BR, America/Sao_Paulo) | `src/lib/admin/labels.ts` |
| Dados do dashboard | `src/lib/repositories/dashboard.ts` |

**Dashboard:** contagens de projetos (publicados, rascunhos e arquivados), serviços e tecnologias (ativos), contatos (novos), além dos 5 últimos contatos, dos 5 projetos atualizados mais recentemente e dos campos públicos vazios em `site_settings`. As consultas usam o cliente da sessão, então o RLS continua valendo. Erros vão para o log do servidor, e a página mostra só uma mensagem genérica.

**Repositórios:** ficam em `src/lib/repositories/`, são `server-only` e recebem o cliente Supabase da requisição. As fases de CRUD seguem esse padrão.

**Tipografia de botões:** `globals.css` (preexistente) declara `button, input, textarea, select { font: inherit; }` fora de `@layer`. No Tailwind 4 isso vence utilitários como `text-sm`/`font-bold` nesses elementos. No admin, tamanho e peso vão no elemento pai. Correção global prevista para a Fase 16, porque afeta também o botão do formulário público.

## CRUD de projetos (Fase 7)

| Rota | Função |
|---|---|
| `/admin/projetos` | lista com filtros (Todos, Publicados, Rascunhos, Arquivados) e contagens, busca literal por título, destaque, ordem e nº de tecnologias |
| `/admin/projetos/novo` | criação (sempre começa como rascunho, a menos que outra situação seja escolhida) |
| `/admin/projetos/[id]` | edição, publicar/arquivar, destaque, ordem, tecnologias ordenáveis, exclusão com confirmação |

Fluxo de gravação:

```text
ProjectForm (client, campos controlados; o React 19 reseta campos não controlados após a action)
  → saveProjectAction(projectId | null)   requireAdmin() + Zod (src/lib/validation/project.ts)
  → saveProject() (src/lib/repositories/projects.ts)
  → rpc admin_save_project                transação única: projeto + vínculos
  → revalidatePublicProjects()            src/lib/revalidate.ts (hoje "/", Fase 9 adiciona /projetos)
```

- **Validação:** o Zod espelha as constraints do banco, com mensagens em pt-BR por campo. Slug vazio é gerado a partir do título (`src/lib/slug.ts`). URLs precisam ser `http(s)://` completas. Tecnologias não podem se repetir (máximo de 30).
- **Erros do banco:** slug duplicado vira erro no campo. Os demais viram mensagem genérica, com o detalhe só no log do servidor.
- **Situação:** é um único campo (`visibility`): rascunho, publicado ou arquivado. Arquivado nunca está publicado (constraint). Exclusão é permanente e remove os vínculos (cascade). Para tirar do site, o caminho é arquivar.
- **Capa:** tem formulário próprio na edição (Fase 8, abaixo).

## Capa do projeto / Storage (Fase 8)

```text
CoverImageForm (client: prévia local, bloqueio > 5 MB)
  → updateProjectCoverAction(projectId)     requireAdmin(); intent = upload | remove
  → validateImageFile()                      src/lib/storage/images.ts: tipo pelos magic bytes (JPEG/PNG/WebP/AVIF), ≤ 5 MB
  → replaceProjectCover()                    src/lib/repositories/project-cover.ts
       1. upload de objeto novo e imutável (sessão do admin → policies do Storage)
       2. update projects.cover_image
          ↳ se falhar: remove o objeto novo (sem órfão)
       3. remove a capa anterior (só caminhos do próprio bucket)
  → revalidatePublicProjects()
```

- **Upload pelo servidor** (Server Action), e não direto do navegador, para validar o **conteúdo** do arquivo. Nome e `Content-Type` do cliente são ignorados, então um SVG/HTML renomeado para `.png` é recusado. Limite de corpo das Server Actions: `6mb` em `next.config.ts` (5 MB mais o overhead do multipart).
- **Excluir projeto** remove também `projects/<id>/` do bucket (best-effort, com log).
- `next/image`: `remotePatterns` permite apenas `<NEXT_PUBLIC_SUPABASE_URL>/storage/v1/object/public/portfolio/**`. Outros domínios recebem 400. A URL do Supabase precisa existir no ambiente **no build**.
- `publicImageUrl()` monta a URL pública a partir do caminho salvo.

## CRUD de serviços (Fase 10)

| Rota | Função |
|---|---|
| `/admin/servicos` | lista com ícone resolvido, slug, ordem, linha de tecnologias e Ativo/Inativo |
| `/admin/servicos/novo` | criação (ativo por padrão) |
| `/admin/servicos/[id]` | edição, ativar/desativar, ordem, ícone e exclusão com confirmação |

Serviços não têm relacionamentos, então a gravação usa **escrita direta na tabela** (`insert`/`update`/`delete` com a sessão do admin); o RLS aplica `is_admin()` no banco. Não houve migration nesta fase.

**Ícones:** `src/lib/services/icons.ts` mantém a allowlist (31 ícones Lucide). O banco guarda só o **nome**; o Zod aceita apenas nomes da lista e `resolveServiceIcon()` cai no ícone padrão se encontrar um nome desconhecido, então o site nunca quebra por um valor inesperado. A checagem usa `Object.hasOwn` — com `in`, nomes de protótipo como `toString` passariam pela validação.

**Seção pública:** `src/components/sections/Services.tsx` lê os serviços ativos do Supabase (`listActiveServices`) preservando o layout original, com **fallback para as constants** em caso de erro. Escritas chamam `revalidatePublicServices()` → `revalidatePath("/")`.

## Administradores

Admin é um usuário do Supabase Auth com linha ativa em `private.admin_users`. Não existe cadastro pelo site.

**Criar o administrador (uma vez):**

1. Supabase Dashboard → **Authentication → Users → Add user → Create new user**: informe o e-mail e a senha e marque **Auto Confirm User**.
2. Conceder admin (pelo conector ou no SQL Editor):
   ```sql
   insert into private.admin_users (user_id)
   select id from auth.users where email = 'manjabosco98@gmail.com'
   on conflict (user_id) do update set active = true;
   ```
3. **Desativar o cadastro público:** Authentication → Sign In / Providers → desmarcar **Allow new users to sign up**. Um usuário criado por signup não teria acesso a nada (RLS e `requireAdmin`), mas não há motivo para permitir contas.

Revogar: `update private.admin_users set active = false where user_id = ...` (efeito imediato na próxima requisição).

Produção (Fase 21): configurar em Authentication → URL Configuration a Site URL do domínio no Render. Login por senha não depende de redirect URLs; recuperação de senha, se implementada, dependerá.

## Testes

- `tests/auth.test.mjs` (em `npm test`): regra do proxy, cookies e headers no redirect, `getAuthState` / `requireAdmin` (inclusive falha do RPC), login (validação, mensagem genérica, 429, não-admin deslogado, admin redirecionado) e logout.
- `tests/admin.test.mjs` (em `npm test`): navegação ativa e agregação do dashboard (filtros, pendências de settings, erro sem vazamento).
- `tests/services.test.mjs` (em `npm test`): allowlist de ícones (inclui nomes de protótipo), validação do formulário, repositório (insert/update, slug duplicado, linha ausente) e actions.
- `tests/projects.test.mjs` (em `npm test`): slug, validação do formulário, repositório (filtros, busca literal, mapeamento de erros) e actions (admin obrigatório, criar, editar, slug duplicado, excluir).
- `tests/e2e/admin-auth.e2e.mjs`: 32 verificações HTTP contra o Cloud real (Auth + dashboard com números reais + seções protegidas).
- `tests/e2e/admin-projects.e2e.mjs`: 22 verificações do CRUD real (validação, slug duplicado, rascunho invisível ao público, publicar, reordenar tecnologias, arquivar, bloqueio de não-admin/anônimo, excluir, sem resíduos). Os helpers ficam em `tests/e2e/http.mjs`.
- `tests/storage.test.mjs` (em `npm test`): detecção por magic bytes (inclui SVG disfarçado), limites, caminhos, URL pública, fluxo de troca com rollback, remoção e actions.
- `tests/e2e/admin-services.e2e.mjs`: 21 verificações do CRUD real e da seção pública (validação, ícone fora da allowlist, slug duplicado, criar/ativar aparecendo na home, desativar saindo do site, reativar com novo ícone, bloqueio de não-admin/anônimo, excluir, sem resíduos).
- `tests/e2e/admin-storage.e2e.mjs`: 23 verificações com uploads reais (PNG gerado em `tests/e2e/fixtures.mjs`): URL pública e cache, `next/image`, SVG disfarçado, arquivo acima de 5 MB, troca remove a anterior, anon/não-admin sem acesso pela Storage API, bucket recusando SVG, remoção e limpeza da pasta ao excluir o projeto. Instruções no cabeçalho do arquivo. Usuários temporários:
  ```sql
  with u as (
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change)
    select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', e,
      extensions.crypt('<senha>', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
    from unnest(array['e2e-admin@test.invalid', 'e2e-user@test.invalid']) e
    returning id, email
  ), i as (
    insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    select gen_random_uuid(), id, id::text,
      json_build_object('sub', id::text, 'email', email, 'email_verified', true), 'email', now(), now()
    from u returning user_id
  )
  insert into private.admin_users (user_id) select id from u where email = 'e2e-admin@test.invalid';
  ```
