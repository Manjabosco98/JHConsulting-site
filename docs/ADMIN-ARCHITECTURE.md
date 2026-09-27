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
- `tests/e2e/admin-auth.e2e.mjs`: 21 verificações HTTP contra o Cloud real. Instruções no cabeçalho do arquivo. Usuários temporários:
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
