# 03 — Configuração e operação

## Projeto Supabase (único)

| Campo | Valor |
|---|---|
| Nome | `jhconsulting-site` |
| Project ref | `qlgxzpowqijcvnwuqchh` |
| URL da API | `https://qlgxzpowqijcvnwuqchh.supabase.co` |
| Organização | Manjabosco |
| Região | `sa-east-1` (São Paulo) |
| PostgreSQL | 17 |
| Storage | bucket `portfolio` |

Nunca criar outro projeto. Nunca alternar de projeto entre fases.

## Variáveis de ambiente

Arquivo local: `.env.local` (ignorado pelo Git). O modelo versionado é `.env.example`.

### Obrigatórias

| Variável | Uso | Observação |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Todos os clientes Supabase | Precisa ser HTTPS. **Necessária no build** (o `next/image` monta a allowlist a partir dela) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Todos os clientes Supabase | Formato `sb_publishable_...`. Pública por natureza; a proteção é o RLS |
| `NEXT_PUBLIC_SITE_URL` | `metadataBase`, canonical, robots, sitemap | Em produção, o domínio real |

### Necessárias para o formulário de contato

| Variável | Uso |
|---|---|
| `SUPABASE_SECRET_KEY` | **Grava o lead** no banco. Formato `sb_secret_...`, somente servidor, nunca com prefixo `NEXT_PUBLIC_`. É a única variável realmente necessária para não perder um contato |
| `RESEND_API_KEY` | Aviso por e-mail do novo lead |
| `CONTACT_FROM_EMAIL` | Remetente (domínio verificado no Resend) |
| `CONTACT_TO_EMAIL` | Destinatário dos avisos |

As duas coisas são independentes: com a chave e sem Resend, o lead é gravado e aparece em `/admin/contatos` sem aviso por e-mail; com Resend e sem a chave, o aviso chega mas o lead não fica registrado. Sem nenhuma das duas, o endpoint responde **503** em vez de fingir sucesso.

### Opcionais / ferramentas

| Variável | Uso |
|---|---|
| `SUPABASE_PROJECT_ID` | Geração de tipos pela CLI (`npm run supabase:types`). Não é segredo |
| `NEXT_PUBLIC_GA_ID` | Google Analytics, se houver |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Reservadas; anti-spam não integrado |

### Removidas na Fase 14

`NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_LINKEDIN_URL`, `NEXT_PUBLIC_GITHUB_URL` e `NEXT_PUBLIC_INSTAGRAM_URL` **não são mais lidas**. A fonte de verdade desses dados é `/admin/configuracoes` (tabela `site_settings`). Se ainda existirem no seu `.env.local`, são inofensivas, mas podem sair.

## Comandos

```bash
npm install          # instala dependências
npm run dev          # desenvolvimento em http://localhost:3000
npm run lint         # ESLint
npm test             # 108 testes unitários (sem rede, sem banco)
npm run typecheck    # tsc --noEmit
npm run build        # build de produção
npm start            # serve o build
npm run supabase:types   # regenera src/types/database.ts (exige SUPABASE_PROJECT_ID exportado)
```

`npm run build` deve rodar antes do `typecheck` num checkout limpo, para o Next gerar os tipos de rota.

## Como rodar os testes E2E

As 8 suítes em `tests/e2e/` batem no **Supabase Cloud real** e exigem servidor de produção e dois usuários temporários.

1. Criar os usuários temporários (pelo conector Supabase ou SQL Editor). O SQL completo está em `docs/ADMIN-ARCHITECTURE.md`; cria `e2e-admin@test.invalid` (admin) e `e2e-user@test.invalid` (sem permissão), ambos com a senha que você escolher.
2. Subir o servidor:
   ```bash
   npm run build
   npx next start --hostname 127.0.0.1 --port 3431
   ```
3. Rodar as suítes:
   ```bash
   E2E_PASSWORD='<senha>' node --env-file=.env.local tests/e2e/admin-auth.e2e.mjs
   # idem para admin-projects, admin-storage, public-projects,
   #            admin-services, admin-technologies, admin-settings, admin-contacts
   ```
4. Apagar os usuários: `delete from auth.users where email like 'e2e-%@test.invalid';`

As suítes limpam o que criam e a de configurações restaura os valores originais. Mesmo assim, confira ao final que não sobrou resíduo (`slug like 'e2e-%'`).

**Exceção: contatos.** Um contato é registro histórico — nem o admin nem a `service_role` podem apagar. A suíte de contatos, portanto, **não limpa o que cria**; a remoção é feita pelo conector depois:

```sql
delete from public.contacts where email like 'e2e-contato-%@test.invalid';
```

Sem a `SUPABASE_SECRET_KEY`, a suíte não consegue criar o lead pelo formulário e usa um contato semeado com esse mesmo padrão de e-mail.

**Nota de ambiente:** durante o desenvolvimento, `npm install`/`build` rodam numa cópia temporária fora da pasta sincronizada pelo Google Drive, para não sincronizar `node_modules`.

## Criar e revogar administrador

Não existe cadastro pelo site. Um admin é um usuário do Supabase Auth com linha ativa em `private.admin_users`.

**Criar:**

1. Supabase Dashboard → **Authentication → Users → Add user**: informe e-mail e senha e marque **Auto Confirm User**.
2. Conceder permissão:
   ```sql
   insert into private.admin_users (user_id)
   select id from auth.users where email = 'seu-email@dominio.com'
   on conflict (user_id) do update set active = true;
   ```

**Revogar** (efeito imediato na próxima requisição):
```sql
update private.admin_users set active = false where user_id = '<uuid>';
```

**Desativar o cadastro público** (recomendado antes de produção): Authentication → Sign In / Providers → desmarcar **Allow new users to sign up**. Não é o que protege os dados (o RLS protege), mas não há motivo para permitir contas.

## Migrations

O histórico local é **espelho exato** do Cloud. Ao criar uma migration:

1. Aplicar pelo conector Supabase (`apply_migration`).
2. Consultar `list_migrations` para pegar a versão gerada.
3. Salvar o arquivo como `supabase/migrations/<versão>_<nome>.sql` com o mesmo SQL.
4. Regenerar `src/types/database.ts`.
5. Rodar a matriz de RLS (`supabase/tests/rls_matrix.sql`) se mexeu em tabelas, grants, policies ou funções.

Nunca reaplicar uma migration às cegas; nunca apagar migration existente sem análise.

## Deploy no Render (Fase 21, não executado)

Previsto: serviço **Node.js**, sem Docker.

- Build: `npm install && npm run build`
- Start: `npm start`
- Node ≥ 22 (ainda falta fixar `engines`/`.nvmrc`)
- Variáveis: todas as obrigatórias **no momento do build**, mais as do Resend
- Supabase Auth → URL Configuration: apontar a Site URL para o domínio
- Uploads nunca no filesystem do Render: tudo em Supabase Storage
