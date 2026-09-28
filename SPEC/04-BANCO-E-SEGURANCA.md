# 04 — Banco e segurança

Detalhe completo (colunas, constraints, índices, grants por papel) em `docs/DATABASE.md`. Aqui está o modelo e o raciocínio de segurança.

## Tabelas

```text
projects ──┬── project_technologies ──┐
           │                          ├── technologies ──┬── technology_group_members ── technology_groups
           │                          │                  │
services   site_settings (id=1)   contacts        private.admin_users ── auth.users
```

| Tabela | Papel | Registros hoje |
|---|---|---|
| `projects` | Cases do portfólio: slug, categoria, rótulo editorial, problema, solução, descrição, capa, links, destaque, ordem, publicação, arquivamento | 3 |
| `technologies` | Catálogo de tecnologias | 32 |
| `project_technologies` | Tecnologias de cada projeto, ordenadas | 12 |
| `technology_groups` | Grupos da seção Tecnologias (Backend, Dados…) | 7 |
| `technology_group_members` | Quais tecnologias em cada grupo (N:N) | 29 |
| `services` | Serviços da home: ícone, linha editorial, ordem, ativo | 8 |
| `site_settings` | Linha única (`id = 1`) com identidade, contato e redes | 1 |
| `contacts` | Leads do formulário, com status de atendimento | 0 |
| `private.admin_users` | Quem é administrador (`active`) | 0 |

Decisões de modelagem que valem registro:

- **`technology_groups` em N:N** porque Python pertence a dois grupos; uma coluna de categoria perderia dado.
- **`services.tech`** preserva a linha editorial dos cards ("Python • Playwright • APIs").
- **Três estados de projeto** derivados de duas colunas: rascunho, publicado e arquivado. Uma constraint garante que arquivado nunca esteja publicado.
- **`site_settings` como singleton** com `check (id = 1)`: não há como criar uma segunda linha por acidente.
- **Rótulo editorial (`status`) é independente da publicação.** "Case técnico" é texto exibido; publicar é outra coisa.

## Quem pode o quê

| Papel | Conteúdo público | `site_settings` | `contacts` | `private` |
|---|---|---|---|---|
| `anon` | somente leitura do que está publicado/ativo | leitura | **nada** | **nada** |
| `authenticated` **sem** admin | igual ao anônimo; escritas afetam 0 linhas | leitura | nada | executa `is_admin()` (retorna false) |
| `authenticated` **admin** | CRUD completo | leitura e escrita | lê e altera **só** `status` | não lê a tabela de admins |
| `service_role` | nada | nada | insere **só** as colunas do formulário | nada |

Detalhes que fecham brechas:

- **RLS habilitado em todas as tabelas**, com exatamente uma policy permissiva por (tabela, papel, ação).
- **`private.admin_users` não tem policy**: negação total pela API, inclusive para admins. É consultada apenas pela função `is_admin()` (SECURITY DEFINER, `search_path` vazio).
- **`admin` não apaga nem edita a mensagem de um contato.** Só muda o status. O lead é registro histórico.
- **Privilégios padrão revogados**: toda tabela nova em `public` nasce sem acesso para `anon`/`authenticated`/`service_role`. Isso evitou um problema real — os defaults do Supabase concediam até `TRUNCATE`, que ignora RLS.

## Funções

| Função | O que faz |
|---|---|
| `public.is_admin()` | Responde se o **próprio** usuário da sessão é admin ativo. Sem parâmetros (não há como perguntar por outro usuário) |
| `public.admin_save_project(...)` | Cria/atualiza projeto **e** substitui suas tecnologias numa transação. A ordem do array vira a ordem de exibição |
| `public.admin_save_technology_group(...)` | Idem para grupo e seus membros |
| `public.admin_delete_technology(p_id)` | Remove vínculos de grupo e exclui a tecnologia. **Bloqueia** se algum projeto a usa |

Todas são `SECURITY INVOKER` (o RLS do chamador continua valendo) com `EXECUTE` apenas para `authenticated`. A checagem explícita de admin dentro delas só antecipa um erro claro.

## Storage

Bucket **`portfolio`**:

- **Leitura pública por URL** (as imagens aparecem no site), mas **sem policy de SELECT para anônimo**: ninguém lista o bucket pela API. Só quem tem a URL exata abre o arquivo.
- Escrita, alteração, listagem e remoção: **somente admin ativo**.
- Limites no próprio bucket, além do app: 5 MiB e apenas JPEG, PNG, WebP e AVIF. **SVG fica de fora** por poder conter script.
- Caminhos imutáveis: `projects/<projectId>/<uuid>.<ext>` e `settings/<uuid>.<ext>`, com cache de 1 ano.
- `DELETE` direto em `storage.objects` é bloqueado por trigger do Supabase para qualquer papel; remoção só pela Storage API.

## Modelo de ameaças assumido

O que foi considerado e está coberto:

| Ameaça | Mitigação | Verificado por |
|---|---|---|
| Visitante lendo rascunhos | RLS filtra por `published`/`archived_at` | Matriz + E2E |
| Alguém criar conta e escrever | Escrita exige `is_admin()`; conta sem permissão afeta 0 linhas | Matriz + E2E (sessão criada fora do app) |
| Chamar Server Action direto | Toda action chama `requireAdmin()` | E2E (não-admin e anônimo) |
| Upload de SVG/HTML com script | Tipo detectado pelos **magic bytes**, não pelo nome ou Content-Type; bucket também recusa | Unitário + E2E |
| Escalonar privilégio via `admin_users` | Tabela sem policy; função sem parâmetro | Matriz |
| Vazar detalhe do banco na tela | Erros genéricos na UI, detalhe só no log | Unitário |
| Texto editável quebrar o JSON-LD | `<` escapado na serialização | Código |
| Página com sessão ser cacheada por CDN | Proxy envia `Cache-Control: no-store` junto dos cookies | E2E |
| `/admin` aparecer em busca | `noindex` por metadata e header, `Disallow` no robots | E2E |
| Bot inundando o formulário | Honeypot (responde 200 e não grava) + 5 envios por minuto por endereço | Unitário + E2E |
| Corpo malformado derrubar o endpoint | `request.json()` em try/catch → 400 | Unitário + E2E |
| Lead ser perdido por falha de e-mail | Grava antes de notificar; 503 só quando os dois falham | Unitário + E2E |
| Chave privilegiada escrever além do formulário | Grants por coluna: insere 7 colunas, lê só `id`, nada de `status` | Matriz |
| Site embutido em iframe (clickjacking) | `X-Frame-Options: DENY` e CSP `frame-ancestors 'none'` em todas as rotas | E2E |
| Navegador adivinhando tipo de conteúdo | `X-Content-Type-Options: nosniff` | E2E |
| URL vazando para outra origem | `Referrer-Policy: strict-origin-when-cross-origin` | E2E |
| `<base>` ou formulário sequestrado | CSP `base-uri 'self'` e `form-action 'self'` | E2E |
| Corpo gigante no endpoint de contato | Stream medido e cancelado em 64 KB, não só `Content-Length` | Unitário + E2E |
| Sessão renovada depois do logout | Logout com escopo `global`: os refresh tokens são revogados no servidor | Unitário |
| Rate limit driblado forjando `X-Forwarded-For` | Conta o **último** hop, que é o que o proxy mais próximo observou | Unitário |
| Segredo versionado ou embutido no bundle | Guardas estáticos sobre o código e sobre o `.env.example` | Unitário |

Limites conhecidos, registrados de propósito:

- **Logout não invalida o access token já emitido.** Desde a Fase 18 os refresh tokens são revogados no servidor (escopo `global`), então a sessão não pode ser renovada; o access token em circulação continua válido até expirar, porque é assim que JWT funciona. Encurtar esse tempo é uma configuração no Supabase Auth.
- **Cadastro público do Auth está aberto.** Não dá acesso a dados, mas deve ser desativado.
- **Proteção contra senha vazada está desligada** (alerta do próprio Supabase). Com uma conta só, protegida por senha, vale ligar.
- **Rate limit do formulário é em memória por processo.** Não coordena entre instâncias.
- **O cliente do rate limit vem do último hop de `x-forwarded-for`.** Atrás de um proxy que acrescenta o endereço observado — o caso do Render — o valor é confiável. Sem proxy nenhum na frente, não há nada confiável nesse cabeçalho, e o limite vale como freio contra abuso casual, nunca como controle de acesso.
- **Anti-spam se resume a honeypot e rate limit.** O Turnstile existe só como variável de ambiente.
- **Não há CSP de `script-src`.** As diretivas aplicadas são as que não exigem nonce; uma política de scripts de verdade exigiria nonce por requisição, com risco de quebra e pouco ganho num site sem incorporações de terceiros.

## Como validar a segurança

`supabase/tests/rls_matrix.sql` — **89 casos** cobrindo anon, usuário comum, admin inativo, admin e `service_role`, incluindo as RPCs e o Storage. Roda pelo conector, cria seus próprios dados e termina com `RAISE`, então **a transação é sempre desfeita**.

Resultado esperado: `RLS_MATRIX pass=89 fail=0`. Rodar após qualquer mudança em schema, grants, policies ou funções.
