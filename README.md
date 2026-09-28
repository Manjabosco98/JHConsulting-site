# JHConsulting — Site institucional e portfólio

Next.js existente, com evolução incremental para conteúdo administrável no Supabase Cloud. Projetos, serviços, tecnologias, informações institucionais e contatos vêm do Supabase (com ISR e revalidação on-demand). `src/constants/content.ts` guarda apenas o texto editorial da página, que não é conteúdo administrável. O formulário usa Zod, honeypot, rate limit, grava o lead no banco e avisa por Resend.

## Stack

Next.js 16.3.3, React 19, TypeScript strict, Tailwind 4, Lucide, Zod, Resend, `@supabase/supabase-js` 2.117.2 e `@supabase/ssr` 0.12.7. A dependência Motion saiu na Fase 16: era 120 KB de JavaScript no cliente para uma única animação de entrada, hoje feita com IntersectionObserver e CSS. Os pacotes Supabase estão fixados no lockfile. O SDK requer Node >=22; a validação atual usa Node 24.20.0/npm 11.19.0.

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Configure `.env.local` com os campos de `.env.example`. Não substitua um arquivo de ambiente já configurado nem versionar credenciais. O Next carrega esse arquivo automaticamente.

A única infraestrutura de dados autorizada é **Supabase Cloud**, tanto no desenvolvimento quanto na produção. Não usar Docker, Supabase local ou banco local. Os scripts npm de start/stop/status/reset do Supabase já haviam sido removidos; na Fase 19 saíram também o `supabase/config.toml` e o `supabase/seed.sql`, que descreviam um ambiente local inexistente — o `project_id` daquele arquivo sequer era o ref do projeto Cloud. Em `supabase/` restam apenas as migrations (espelho do Cloud) e a matriz de RLS.

## Validação

```bash
npm run lint         # sem erros e sem avisos
npm test             # 136 unitários, sem rede e sem banco
npm run build
npm run typecheck
npm start
```

Os testes unitários usam mocks de I/O: nenhum banco local, nenhum e-mail enviado. O build deve preceder o typecheck num checkout limpo, para gerar os tipos de rotas do Next.

Há mais dois níveis, que exigem um servidor no ar e estão documentados em [SPEC/03-CONFIGURACAO.md](SPEC/03-CONFIGURACAO.md):

- **E2E** (`tests/e2e/`, 8 suítes, 230 verificações) contra o Supabase Cloud real, com usuários temporários;
- **navegador** (`npm run test:browser`, 12 verificações) para o formulário público, que só existe depois da hidratação. O `fetch` da página é substituído, então não envia e-mail nem grava nada.

A matriz de RLS (`supabase/tests/rls_matrix.sql`, 89 casos) roda pelo conector e sempre desfaz a transação.

## Supabase Cloud

Os clientes público, de sessão e de browser estão separados em `src/lib/supabase/` e usam apenas URL HTTPS e chave **publishable**, via `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A factory de servidor é por requisição e recebe os cookies do Next. Essas duas variáveis são necessárias já no build, porque as páginas públicas leem do banco.

`SUPABASE_SECRET_KEY` (`sb_secret_...`) é usada em **um único lugar**: gravar o contato recebido pelo formulário público (`src/lib/supabase/secret.ts`). Nunca pode receber prefixo `NEXT_PUBLIC_`. Sem ela o site funciona, mas os leads não são registrados. O painel fica em `/admin` (login em `/admin/login`, e-mail + senha): o proxy renova a sessão e o servidor autoriza via `requireAdmin()`. Veja [docs/ADMIN-ARCHITECTURE.md](docs/ADMIN-ARCHITECTURE.md), inclusive como criar o administrador.

Projeto Cloud: **jhconsulting-site** (ref `qlgxzpowqijcvnwuqchh`, `sa-east-1`). Operações suportadas devem ser realizadas pelo conector Supabase. Os arquivos em `supabase/migrations` espelham exatamente o histórico aplicado no Cloud (mesmas versões); toda nova migration deve ser aplicada pelo conector e salva aqui com a versão retornada. Schema, grants e RLS estão descritos em [docs/DATABASE.md](docs/DATABASE.md).

`src/types/database.ts` é gerado a partir do schema Cloud. A geração pelo conector é preferencial. Como alternativa de manutenção com a CLI já autenticada, exporte `SUPABASE_PROJECT_ID` no terminal e execute `npm run supabase:types`. O script exige projeto remoto explícito, usa somente schema `public` e preserva os tipos anteriores se falhar; não usa banco local. Regerar sempre após alterar o schema.

## Resend e configuração pública

`RESEND_API_KEY`, `CONTACT_FROM_EMAIL` e `CONTACT_TO_EMAIL` ficam no servidor e servem apenas ao **aviso** de novo lead: o contato é gravado no banco antes, e a ausência do Resend não impede o registro. O domínio `jhconsulting.com.br` está verificado e o envio foi confirmado por um POST real no endpoint.

O contato público (e-mail, WhatsApp, redes) **não fica em variável de ambiente**: é editado em `/admin/configuracoes`. O anti-spam é honeypot mais rate limit por endereço; não há captcha integrado.

## Produção futura

Destino: **Render, serviço Node.js, sem Docker**. `npm ci` → `npm run build` → `npm start`, com Node 24 fixado em `.nvmrc` e `engines`. O fluxo foi validado a partir de um clone limpo, sem `.env.local`, com as variáveis vindas só do ambiente; `render.yaml` na raiz descreve o serviço com `autoDeploy: false`.

**Nenhum deploy foi feito e nenhum está autorizado.** O passo a passo, as variáveis, a configuração de Auth no domínio e a nota de latência entre Render e Supabase estão em [docs/DEPLOY-RENDER.md](docs/DEPLOY-RENDER.md).

## Documentação e fases

Comece pela **[especificação em `SPEC/`](SPEC/README.md)**: visão geral, arquitetura, configuração, estratégias, o que está pronto e o que falta.

Referência técnica, sempre atual:

- [Banco de dados: schema, grants e RLS](docs/DATABASE.md).
- [Painel administrativo: Auth, autorização e cada CRUD](docs/ADMIN-ARCHITECTURE.md).
- [Projetos públicos: rotas, cache, revalidação e SEO](docs/PUBLIC-PROJECTS.md).
- [Configurações do site: painel e consumidores](docs/SITE-SETTINGS.md).

Registro histórico, fotografias de um momento — úteis para entender *por que* as decisões foram tomadas, não para saber como o projeto está hoje:

- [Discovery do código original (Fase 0)](docs/ADMIN-MIGRATION-DISCOVERY.md).
- [Relatório da criação do projeto Cloud (Fase 1)](docs/SUPABASE-FOUNDATION.md).
- [Handoff do agente anterior e diário até a Fase 12](docs/HANDOFF-CODEX-CLOUD.md).

Uma fase por vez, com validação e relatório. A fase seguinte depende de autorização do usuário.