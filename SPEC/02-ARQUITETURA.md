# 02 — Arquitetura

## Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.3.3 |
| UI | React | 19 |
| Linguagem | TypeScript strict | 5.9 |
| Estilo | Tailwind CSS (via PostCSS) | 4.3 |
| Animação | IntersectionObserver + CSS | — |
| Ícones | Lucide React | 0.468 |
| Validação | Zod | 4 |
| E-mail | Resend | 6 |
| Banco / Auth / Storage | Supabase Cloud (`@supabase/supabase-js` 2.117.2, `@supabase/ssr` 0.12.7) | Postgres 17 |
| Runtime | Node | ≥ 22 (validado em 24.20) |
| Hospedagem prevista | Render (serviço Node, sem Docker) | — |

## Estrutura de pastas

```text
src/
├── app/
│   ├── page.tsx                  home (ISR 1h)
│   ├── layout.tsx                generateMetadata a partir das configurações
│   ├── robots.ts, sitemap.ts     SEO (sitemap dinâmico)
│   ├── api/contact/route.ts      formulário de contato (Zod + Resend)
│   ├── projetos/                 listagem e detalhe públicos
│   └── admin/
│       ├── layout.tsx            noindex para todo o /admin
│       ├── actions.ts            login / logout
│       ├── login/                página pública de login
│       └── (painel)/             área protegida (requireAdmin)
│           ├── layout.tsx        sidebar + header
│           ├── page.tsx          dashboard
│           ├── projetos/  servicos/  tecnologias/  configuracoes/  contatos/
│           └── <cada um com page.tsx, actions.ts, novo/, [id]/>
├── components/
│   ├── layout/                   Navbar, Footer
│   ├── sections/                 as 13 seções da home
│   ├── projects/ProjectCard.tsx  card compartilhado (home e /projetos)
│   ├── ui/                       Reveal, SectionHeading, WhatsAppButton
│   └── admin/                    formulários e navegação do painel
├── lib/
│   ├── supabase/                 client (browser) · server (sessão) · public (anônimo) · env
│   ├── auth/                     admin.ts (requireAdmin) · admin-routes.ts (regra do proxy)
│   ├── repositories/             acesso a dados, server-only
│   ├── validation/               schemas Zod por entidade
│   ├── storage/images.ts         validação por magic bytes e caminhos
│   ├── services/icons.ts         allowlist de ícones
│   ├── revalidate.ts             invalidação de cache por área
│   ├── slug.ts, whatsapp.ts      helpers puros
│   └── admin/                    navegação e rótulos do painel
├── constants/                    texto editorial da página e configuração de deploy
├── types/database.ts             tipos gerados do schema real
└── proxy.ts                      renovação de sessão + redirect otimista

supabase/
├── migrations/                   espelho exato do histórico aplicado no Cloud
└── tests/rls_matrix.sql          matriz de acesso (89 casos)

tests/
├── *.test.mjs                    unitários (npm test)
├── browser/                      formulário público via CDP (npm run test:browser)
├── helpers/                      loader de TS isolado e banco falso
└── e2e/                          8 suítes HTTP contra o Cloud real
```

## Quatro clientes Supabase, quatro propósitos

Esta separação é central para entender o projeto:

| Cliente | Arquivo | Usa | Para quê |
|---|---|---|---|
| **Público** (anônimo, sem cookies) | `lib/supabase/public.ts` | chave publishable | Páginas públicas. Sem cookies, então a página continua cacheável (ISR). O RLS libera só o conteúdo publicado |
| **Servidor** (sessão) | `lib/supabase/server.ts` | chave publishable + cookies | Painel e Server Actions. Age **como o admin logado**, então o RLS aplica `is_admin()` no banco |
| **Browser** | `lib/supabase/client.ts` | chave publishable | Disponível para uso client-side; hoje usado apenas indiretamente (login pelos testes E2E) |
| **Privilegiado** | `lib/supabase/secret.ts` | `SUPABASE_SECRET_KEY` | **Um caso só**: gravar o lead do formulário público. Ignora o RLS, então quem o mantém estreito são os grants por coluna em `contacts` |

Os três primeiros nunca usam chave privilegiada. O quarto é `server-only` e não é importado por nenhum componente de cliente.

## Camadas de uma escrita no painel

```text
Formulário (client component, campos controlados)
   │  FormData
   ▼
Server Action  ── requireAdmin()  ─────────▶ redirect /admin/login se não for admin
   │            ── Zod (validation/)  ─────▶ erros por campo, em português
   ▼
Repository (server-only, recebe o cliente da sessão)
   │  tabela direta  ou  RPC transacional quando há relacionamento
   ▼
Postgres ── grants + RLS (is_admin) ── constraints ── triggers
   │
   ▼
revalidate.ts ─▶ revalidatePath das páginas públicas afetadas
```

Pontos que não podem ser esquecidos ao estender:

- **Toda** página e **toda** Server Action do painel chama `requireAdmin()`. Layouts não rodam de novo em navegação client-side, e Server Actions são endpoints públicos.
- Repositories são `server-only` e **recebem** o cliente; não o criam. Isso mantém a sessão correta e os torna testáveis.
- Erros do banco são traduzidos: o que é acionável vira erro de campo (ex.: slug duplicado); o resto vira mensagem genérica, com o detalhe apenas no log do servidor.

## Renderização e cache

| Rota | Modo | Revalidação |
|---|---|---|
| `/` | Estática com ISR | 1h + on-demand |
| `/projetos` | Estática com ISR | 1h + on-demand |
| `/projetos/[slug]` | SSG dos slugs publicados + on-demand para novos | 1h + on-demand |
| `/sitemap.xml`, `/robots.txt` | Estáticas | 1h + on-demand |
| `/api/contact` | Dinâmica | — |
| `/admin/**` | Dinâmica, `noindex` | — |

`src/proxy.ts` (o antigo middleware, renomeado no Next 16) roda **somente** em `/admin`, então o site público não paga esse custo.

## Autorização em profundidade

Quatro barreiras independentes, na ordem:

1. **Proxy** — redireciona quem não tem sessão. É otimista: nunca concede acesso.
2. **`requireAdmin()`** — valida o JWT e pergunta ao banco se o usuário é admin ativo. Falha fechando.
3. **Grants** — definem o teto de cada papel no Postgres.
4. **RLS** — decide linha por linha; `private.admin_users` é inacessível pela API.

Um usuário logado sem permissão é indistinguível de um visitante — comprovado pela matriz de RLS e pelo E2E.
