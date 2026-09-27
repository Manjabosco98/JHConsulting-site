# JHConsulting — Site institucional e portfólio

Next.js existente, com evolução incremental para conteúdo administrável no Supabase Cloud. A home continua consumindo `src/constants/content.ts` e `src/constants/site.ts`; o formulário usa Zod, honeypot, rate limit e Resend. Admin, persistência e páginas de projetos pertencem às próximas fases.

## Stack

Next.js 16.3.3, React 19, TypeScript strict, Tailwind 4, Motion, Lucide, Zod, Resend, `@supabase/supabase-js` 2.117.2 e `@supabase/ssr` 0.12.7. Os pacotes Supabase estão fixados no lockfile. O SDK requer Node >=22; a validação atual usa Node 24.20.0/npm 11.19.0.

## Desenvolvimento

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`. Configure `.env.local` com os campos de `.env.example`. Não substitua um arquivo de ambiente já configurado nem versionar credenciais. O Next carrega esse arquivo automaticamente.

A única infraestrutura de dados autorizada é **Supabase Cloud**, tanto no desenvolvimento quanto na produção. Não usar Docker, Supabase local ou banco local. Os antigos scripts npm de start/stop/status/reset do Supabase foram removidos. O `supabase/config.toml` preexistente é legado local, não configura o projeto Cloud e não deve ser executado/aplicado.

## Validação

```bash
npm run lint
npm test
npm run build
npm run typecheck
npm start
```

Os testes existentes usam mocks de I/O, sem banco local ou envio de e-mails. O build deve preceder typecheck num checkout limpo para gerar os tipos de rotas do Next.

## Supabase Cloud

Os clientes browser e server estão separados em `src/lib/supabase/`. Ambos usam apenas URL HTTPS e chave **publishable**, via `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A factory de servidor é por requisição e recebe os cookies do Next. A home pode ser construída sem essas variáveis porque ainda não chama os clientes.

`SUPABASE_SECRET_KEY` é reservada para uso privilegiado futuro; não é necessária nesta fase e nunca pode receber prefixo `NEXT_PUBLIC_`. Login, renovação de sessão, autorização e proteção administrativa serão implementados na Fase 5. Os clientes atuais sozinhos não protegem rotas.

Projeto Cloud: **jhconsulting-site** (ref `qlgxzpowqijcvnwuqchh`, `sa-east-1`). Operações suportadas devem ser realizadas pelo conector Supabase. Os arquivos em `supabase/migrations` espelham exatamente o histórico aplicado no Cloud (mesmas versões); toda nova migration deve ser aplicada pelo conector e salva aqui com a versão retornada. Schema, grants e RLS estão descritos em [docs/DATABASE.md](docs/DATABASE.md). O seed será tratado na Fase 4.

`src/types/database.ts` é gerado a partir do schema Cloud. A geração pelo conector é preferencial. Como alternativa de manutenção com a CLI já autenticada, exporte `SUPABASE_PROJECT_ID` no terminal e execute `npm run supabase:types`. O script exige projeto remoto explícito, usa somente schema `public` e preserva os tipos anteriores se falhar; não usa banco local. Regerar sempre após alterar o schema.

## Resend e configuração pública

Preservar `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` e `CONTACT_TO_EMAIL` no servidor. URLs, contato público e Analytics são descritos em `.env.example`. Turnstile ainda não está integrado. As falhas conhecidas do formulário e os limites do rate limit estão documentados no discovery; o envio real precisa ser validado quando as credenciais forem configuradas.

## Produção futura

Destino: **Render, serviço Node.js, sem Docker**. Fluxo previsto: `npm install` → `npm run build` → `npm start`. Domínio, env, redirects Auth e configuração final do serviço pertencem à Fase 21. Nenhum deploy está autorizado nesta etapa.

## Documentação e fases

- [Discovery e problemas conhecidos](docs/ADMIN-MIGRATION-DISCOVERY.md).
- [Fundação Cloud e relatório da Fase 1](docs/SUPABASE-FOUNDATION.md).
- [Handoff do Codex (H0)](docs/HANDOFF-CODEX-CLOUD.md).
- [Banco de dados: schema, grants e RLS](docs/DATABASE.md).

Uma fase por vez, com validação e relatório. A fase seguinte depende de autorização do usuário.