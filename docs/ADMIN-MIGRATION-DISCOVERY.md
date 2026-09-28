# FASE 0 — DISCOVERY DO CÓDIGO ATUAL

> **Registro histórico, não estado atual.** Este documento é a fotografia do projeto antes de qualquer fase de implementação, e foi mantido como está de propósito: é ele que explica por que várias decisões foram tomadas. Tudo aqui descrito como "ainda não existe", "deverá" ou "na Fase N" já aconteceu ou foi revisto. Para o estado de hoje, veja [`SPEC/`](../SPEC/README.md).

Data: 27/09/2026. Projeto: JHConsulting. Escopo: exclusivamente análise e validação do código existente, conforme a primeira execução do briefing atual.

## Resultado e limites

**STATUS: FAIL no gate funcional do site; discovery executado e documentado.** Instalação, lint, 11 testes existentes, build e typecheck passaram. A reprodução controlada do formulário confirmou que uma resposta HTTP de sucesso termina em erro visual; a API também retorna 500 para JSON malformado. Essas falhas preexistentes foram registradas, sem correções antecipadas nesta fase de análise.

O projeto é uma landing page Next.js preservável, com conteúdo em constantes e envio de contato por Resend. Há trabalho Supabase previamente iniciado: dois clientes, validação de ambiente, tipos base, testes e três arquivos de migrations, incluindo schema e RLS de domínio. **A existência desses arquivos não comprova projeto Cloud, aplicação das migrations ou integração funcional.** Nenhuma página/API atual usa os clientes.

Este relatório substitui o discovery anterior, que já não correspondia ao disco: agora existem lockfile, testes, clientes e SQL de domínio. Os resultados abaixo são desta execução. `README.md` e `docs/SUPABASE-FOUNDATION.md` permanecem como documentos preexistentes, com divergências listadas adiante; seus resultados históricos não foram utilizados como prova atual.

**Alteração no projeto:** somente este documento. Nenhum projeto Cloud, banco, tabela, Auth, Storage, admin ou deploy foi criado. Nenhum comando de Supabase local ou Docker foi executado. Não foi criado banco temporário para testar.

## 1. Git, ambiente e estrutura

- Diretório: `G:\Meu Drive\EM ANDAMENTO\jhconsulting`.
- `git status --short --branch` e `git rev-parse --show-toplevel`: falharam com `not a git repository`. Não existe `.git` acessível nesta pasta/ancestrais. Não foi inicializado repositório; histórico, autoria, branch, rastreamento e diffs anteriores não podem ser confirmados.
- Não foram encontrados `AGENTS.md` no projeto ou nos ancestrais consultados.
- Ambiente de validação: Windows, Node **24.20.0**, npm **11.19.0**.
- Existem 51 arquivos no inventário inicial, incluindo o artefato ignorado `supabase/.temp/cli-latest`.
- `public/` está vazio. No início não havia `node_modules`, `.next` nem `.env.local` na pasta original. O único arquivo `.env*` encontrado foi `.env.example`.

```text
jhconsulting/
├── src/
│   ├── app/
│   │   ├── api/contact/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── layout/           # Navbar, Footer
│   │   ├── sections/         # 13 seções da landing page
│   │   └── ui/               # Reveal, SectionHeading, WhatsAppButton
│   ├── constants/            # content.ts, site.ts
│   ├── lib/supabase/          # env.ts, client.ts, server.ts
│   └── types/database.ts     # tipos base; tabelas ainda não tipadas
├── public/                   # vazio
├── scripts/generate-supabase-types.mjs
├── tests/                    # supabase.test.mjs, generate-types.test.mjs
├── supabase/
│   ├── config.toml           # configuração preexistente de Supabase local
│   ├── seed.sql              # somente comentários
│   ├── .temp/cli-latest      # ignorado
│   └── migrations/           # três arquivos descritos na seção 7
├── docs/
│   ├── ADMIN-MIGRATION-DISCOVERY.md
│   └── SUPABASE-FOUNDATION.md
├── package.json / package-lock.json
├── tsconfig.json / next.config.ts
├── eslint.config.mjs / postcss.config.mjs / .prettierrc
├── .gitignore / .env.example
└── README.md
```

## 2. Stack e configuração

| Pacote | Manifesto | Resolvido na validação |
|---|---|---|
| Next.js / eslint-config-next | 16.3.3 | 16.3.3 |
| React / React DOM | ^19.2.0 | 19.3.0 |
| TypeScript | ^5.8.0 | 5.9.3 |
| Tailwind / plugin PostCSS | ^4.3.0 | 4.3.3 |
| PostCSS | ^8.0.0 | 8.5.28 |
| Motion | ^12.0.0 | 12.43.0 |
| Lucide React | ^0.468.0 | 0.468.0 |
| Zod | ^4.0.0 | 4.6.5 |
| Resend | ^6.0.0 | 6.30.0 |
| @supabase/ssr | 0.12.7 | 0.12.7 |
| @supabase/supabase-js | 2.117.2 | 2.117.2 |
| Supabase CLI (dev) | 2.118.0 | 2.118.0 |
| client-only / server-only | 0.0.1 | 0.0.1 |
| ESLint | ^9.0.0 | 9.39.5 |
| Prettier | ^3.0.0 | 3.9.9 |

O lockfile foi preservado byte a byte pelo `npm install` na cópia. Nenhuma dependência foi adicionada ou atualizada nesta execução.

Scripts: `dev` usa `next dev --turbopack`; `build`, `start`, `lint`, `test`, `typecheck` e `format` já existem. Testes usam `node --test tests/*.test.mjs`. Há também `supabase:start`, `supabase:stop`, `supabase:status`, `supabase:db:reset` e `supabase:types`; os fluxos locais estão incompatíveis com o briefing Cloud e não devem ser utilizados.

- TypeScript strict, ES2022, bundler, `noEmit`, JSX React e alias `@/*`; sem `any` explícito encontrado em `src`.
- Next: Strict Mode, `poweredByHeader: false`, otimização de imports de Lucide/Motion. Sem imagens remotas configuradas, proxy/middleware, rewrites, server actions ou autenticação.
- ESLint: Next Core Web Vitals + TypeScript, com exclusões de artefatos gerados. Um warning preexistente no export anônimo do PostCSS.
- Tailwind 4 via PostCSS e import CSS; Prettier com ponto e vírgula, aspas duplas e trailing commas ES5.
- Não há `engines`, `.nvmrc`, configuração Render ou workflow CI. A versão Node usada nesta análise ainda não constitui uma versão de produção definida.

## 3. Rotas, componentes e identidade visual

| Rota | Estado observado | Função |
|---|---|---|
| `/` | estática no build; HTTP 200 | landing page |
| `/api/contact` | dinâmica | POST validado + Resend |
| `/robots.txt` | estática; HTTP 200 | regras públicas e sitemap |
| `/sitemap.xml` | estática; HTTP 200 | apenas home |
| `/_not-found` | gerada pelo Next | fallback |
| `/admin`, `/projetos` | inexistentes; HTTP 404 | fases futuras |

A home compõe Navbar, Hero, Authority, Problems, Services, Automation, Solutions, Projects, Workflow, Technologies, About, Differentials, PrimaryCTA, Contact, Footer e WhatsAppButton; inclui JSON-LD.

Apenas **Navbar, Contact e Reveal** são Client Components: menu mobile, submissão/feedback e animação Motion, respectivamente. As demais seções são Server Components sem acesso externo a dados. Não existem repositories, ORM, consultas às tabelas, cache de dados Supabase, ISR configurado, `revalidatePath` ou `revalidateTag`.

A identidade a preservar usa fundo escuro `#080d18`, superfícies `#0d1424`, azul `#3b82f6`, ciano `#22d3ee`, gradientes, cards arredondados, Arial/Helvetica, container de 1180px, grids responsivos e Navbar sticky. Existem focus ring e CSS de reduced motion; a animação JS deverá ser avaliada visualmente na fase apropriada.

A marca é texto, About tem placeholder de foto e cards de projetos não possuem capa nem link de detalhe: a seta é um ícone. Não há `next/image`. A validação desta fase examinou código e HTML de produção; não houve teste visual em navegador, captura de screenshots ou auditoria de acessibilidade.

## 4. Inventário do conteúdo e consumidores

| Fonte em `content.ts` | Quantidade | Consumidor / tratamento futuro |
|---|---:|---|
| authority | 4 | Authority; editorial |
| problems | 6 | Problems; editorial |
| services | 8 | Services; migrar para banco |
| solutions | 6 | Solutions; editorial |
| projects | 3 | Projects; migrar para banco |
| workflow | 6 | Workflow; estrutura editorial |
| technologies | 7 grupos, 29 ocorrências, 28 nomes distintos | Technologies; preservar grupos e ordem |
| differentiators | 5 | Differentials; editorial |
| automationFlow | 5 | Automation; editorial |
| automationBenefits | 6 | Automation; editorial |
| techVisual | 4 | sem consumidor localizado; avaliar na limpeza |

### Projetos

| Título | Categoria | Rótulo atual | Tecnologias |
|---|---|---|---|
| SGECHAT | Plataforma empresarial | Case em evolução | Next.js, APIs, Supabase, Resend |
| Automação Fiscal / NFS-e | Automação empresarial | Case técnico | Python, Playwright, XML, Pandas |
| Dashboards e Integrações | Dados e APIs | Portfólio | Power BI, Power Query, SQL, Python |

Os objetos possuem título, categoria, problema, solução, tecnologias e status editorial. Não possuem ID, slug, descrição curta/longa própria, capa, links, publicação, destaque, datas ou ordem explícita. O seed deverá preservar a ordem do array e os rótulos editoriais separadamente do estado publicado/rascunho. Não inventar resultados, URLs ou imagens.

A união do catálogo com tecnologias dos projetos contém **32 nomes distintos**: Next.js, APIs, Resend e XML aparecem somente nos projetos. Python pertence a dois grupos. Não mesclar silenciosamente APIs/REST APIs ou perder associação múltipla. A migration preexistente já contempla grupos N:N, mas não há seed.

### Serviços

Os oito serviços são Automação de Processos, Desenvolvimento de Sistemas, APIs e Integrações, Dashboards e Dados, Engenharia de Dados, Inteligência Artificial, Backend e Arquitetura e Consultoria Tecnológica.

Cada um tem título, descrição, ícone Lucide e linha editorial `tech`. Essa linha deve ser preservada; a migration existente possui o campo correspondente. Ícones são componentes React e deverão virar identificadores resolvidos por um mapa permitido no frontend.

As menções a Docker em `content.ts` descrevem competências oferecidas pela empresa. Não constituem dependência de execução do site e não foram removidas. Não há Dockerfile ou compose encontrado no projeto.

### Informações institucionais e outros textos

`site.ts` contém empresa, profissional, cargo, descrição, URL, e-mail, WhatsApp, redes, localização, área de atendimento, sete âncoras de navegação e `whatsappHref`. O helper elimina caracteres não numéricos, codifica a mensagem e retorna `#contato` sem número configurado.

Consumidores: Navbar, Footer, Hero, About, PrimaryCTA, WhatsAppButton, layout, page, robots e sitemap. Instagram é lido, mas não exibido no Footer. Não há telefone institucional separado de WhatsApp nas constantes.

Há conteúdo também **fora das constantes**: headline/copy do Hero; título nominal e três parágrafos do About; marca/tagline/copyright do Footer; rótulos, CTAs e títulos das seções; nove tipos de projeto no Contact; metadata e endereço Schema.org. Apenas alterar `siteConfig.name` não atualiza todas as ocorrências da marca. A Fase 12 deverá conectar os campos institucionais aos consumidores efetivos, preservando layout e copy não incluída no escopo administrativo.

URL de implantação, chaves, Analytics e destinatários operacionais do Resend devem permanecer em ambiente; settings públicos conterão apenas dados institucionais. As constantes só poderão ser removidas após migração e validação, na Fase 14.

## 5. Contato, Zod e Resend

Fluxo atual: formulário → POST JSON → rate limit → Zod → honeypot → verificação de configuração → Resend → resposta. **Não há persistência de contatos.**

Schema inline do servidor: nome 2–100, empresa opcional até 120, e-mail válido até 160, WhatsApp opcional até 40, tipo 2–80, mensagem 20–4000, website opcional. Não há trim nem enum para tipo. O cliente usa `required`, `type=email` e `minLength` da mensagem; não compartilha schema nem todos os limites.

Rate limit: Map em memória, cinco tentativas/IP/60 segundos; a sexta recebe 429. Requisições inválidas também contam. O IP usa o primeiro `x-forwarded-for`, com fallback `unknown`. Não há limpeza global das chaves antigas nem coordenação entre instâncias; a confiança no header dependerá do proxy Render.

Respostas: 400 para payload inválido; 200 sem envio para honeypot preenchido com payload válido; 503 para env Resend ausente; 502 para erro retornado pelo SDK; 200 para sucesso. A mensagem é texto simples, com `replyTo` do visitante. Exceções de parse JSON e exceções lançadas pelo SDK não recebem tratamento controlado.

**Falha funcional reproduzida:** `Contact.tsx:11` acessa `e.currentTarget.reset()` após `await fetch`. O React DOM instalado limpa `currentTarget` ao terminar o dispatch síncrono. Um harness executou o componente real transpilado, simulando essa limpeza e HTTP bem-sucedido: `loading → success → error`, sem chamar reset. A limpeza foi conferida no `react-dom-client.production.js` instalado. É uma reprodução controlada, não E2E nem envio real. A correção futura é reter a referência do formulário antes do await e verificar o caminho de sucesso.

JSON malformado foi confirmado também pelo servidor Next em produção: HTTP 500. A exceção lançada pelo SDK foi reproduzida com Resend simulado. Nenhum e-mail foi enviado.

Pendências para a Fase 13: salvar antes de enviar e-mail; definir resposta quando a gravação funcionar mas o Resend falhar; evitar submissões duplicadas; compartilhar schemas e melhorar mensagens/feedback acessível. Turnstile existe apenas em variáveis de exemplo. O feedback atual não possui `aria-live`.

## 6. SEO, ambiente e segurança de configuração

- `layout.tsx`: pt-BR, metadataBase, title/template, descrição, keywords, canonical `/`, Open Graph pt_BR, Twitter summary_large_image e index/follow.
- `page.tsx`: ProfessionalService, fundador, área BR e endereço fixo Goiânia/GO em JSON-LD.
- Robots permite todo o site; sitemap tem somente home e data de geração como lastModified.
- GA é opcional via `NEXT_PUBLIC_GA_ID` e `next/script afterInteractive`; não há GTM, Clarity ou Turnstile funcional.
- Sem imagem OG configurada. O build sem env expõe `https://seudominio.com.br` no sitemap/canonical: placeholder, não domínio confirmado.
- Futuramente, `/admin` precisa de noindex e proteção servidor; cada projeto precisa de canonical próprio e metadata dinâmica; sitemap deve listar apenas publicados. Robots não é controle de acesso.
- Ao passar JSON-LD a consumir texto editável, escapar `<` na serialização. As âncoras da Navbar devem apontar à home quando usadas em páginas internas.

| Variáveis no exemplo | Uso atual |
|---|---|
| NEXT_PUBLIC_SITE_URL | URL pública/SEO |
| NEXT_PUBLIC_WHATSAPP_NUMBER, NEXT_PUBLIC_CONTACT_EMAIL | contato público |
| NEXT_PUBLIC_LINKEDIN_URL, NEXT_PUBLIC_GITHUB_URL | redes |
| NEXT_PUBLIC_INSTAGRAM_URL | lida sem renderização atual |
| NEXT_PUBLIC_GA_ID | Analytics opcional |
| NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | factories Supabase |
| SUPABASE_SECRET_KEY | reservada; sem uso |
| RESEND_API_KEY, CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL | Route Handler |
| TURNSTILE_SECRET_KEY, NEXT_PUBLIC_TURNSTILE_SITE_KEY | sem uso |

O exemplo usa placeholders ou campos vazios. Não foi criado env real nem lida/exibida credencial. A base atual usa publishable/secret, em vez dos nomes anon/service_role exemplificados conceitualmente no briefing; não é necessário trocar nomes sem motivo. A factory rejeita chaves legadas/privilegiadas no campo público. Valores vazios em `site.ts` não recebem os fallbacks de `??` e exigem atenção futura.

`.gitignore` cobre `.env*` com exceção de `.env.example`, dependências, builds, logs, tsbuildinfo, coverage, relatórios de testes e `supabase/.temp`. Isso não permite auditar secrets em histórico Git, que não está disponível.

## 7. Supabase previamente iniciado: estado real do código

### Clientes e tipos

- `env.ts`: valida URL HTTP(S) e prefixo publishable com Zod somente ao solicitar cliente; erros citam nomes de campos, sem valores.
- `client.ts`: `client-only`, factory browser tipada, somente configuração pública.
- `server.ts`: `server-only`, cliente por requisição, `await cookies()`, getAll/setAll; tolera impossibilidade de escrever cookies em Server Components. Não valida identidade ou papel administrativo.
- Não existe Proxy de renovação de sessão, login, logout, autorização servidor, usuário admin configurado no código ou rota administrativa.
- `database.ts`: Json e mapas vazios de tabelas/views/functions/enums. Não reflete o SQL de domínio existente.
- `generate-supabase-types.mjs`: gravação temporária/rename protege tipos de falha, mas chama **`supabase gen types typescript --local`**, incompatível com o briefing. Não foi executado contra CLI real; os testes usam mock.
- Não há consumidor dessas factories em páginas, componentes ou API de contato.

### Migrations e seed encontrados

| Arquivo | Estado em disco | Observação |
|---|---|---|
| 20260926205118_foundation_security_defaults.sql | 777 bytes | revoga defaults de tabelas, sequências e funções para anon/authenticated/service_role; não cria domínio |
| 20260926205147_foundation_security_defaults.sql | zero bytes | migration vazia; origem/aplicação desconhecidas |
| 20260927125635_content_model_rls.sql | 15.064 bytes | schema de domínio, constraints, índices, funções, triggers, grants e RLS |
| seed.sql | comentários | nenhum registro de conteúdo; não implementa seed idempotente |

O SQL de domínio declara:

- `projects`, `technologies`, `project_technologies`, `services`, `site_settings` e `contacts`;
- `technology_groups` e `technology_group_members` para preservar agrupamento N:N;
- `private.admin_users`, referenciada a `auth.users`, e helper `private.is_admin()`;
- UUIDs nas entidades, slug unique, PKs compostas, FKs, checks de tamanho/URL/ordem/publicação e enum dos cinco status de contato;
- settings singleton com ID 1, bio/profile_image, serviços com `tech`, projetos com `archived_at` e vínculos ordenáveis;
- triggers de updated_at e published_at; índices para conteúdo público ordenado, FKs reversas e listagem de contatos por status/data;
- RLS nas nove tabelas declaradas; leitura pública restrita a publicados/ativos/settings e vínculos visíveis; políticas admin pelo helper;
- contatos sem grant público, authenticated limitado a SELECT e UPDATE(status), condicionado a admin; service_role com privilégios de inserção limitados e SELECT(id).

O helper admin é SECURITY DEFINER, em schema privado, com search_path vazio, verificação de auth.uid e EXECUTE restrito a authenticated. Isso é uma proposta de autorização já escrita, **não uma validação de segurança Cloud**. Memberships, grants efetivos, owners, RLS, consultas e privilégios não foram testados em banco. O arquivo mistura schema e RLS, enquanto o cronograma atual separa as Fases 2 e 3; reconciliar sem expor tabelas em nenhuma etapa.

A primeira migration, isoladamente, não comprova revogação de privilégios herdados de PUBLIC; o SQL de domínio contém tratamento adicional. Não apagar ou reaplicar migrations antes de consultar o histórico remoto na fase autorizada.

### Infraestrutura Cloud versus configuração local

`supabase/config.toml` configura serviços locais: PostgreSQL 17, API/Studio, Auth, Storage com limite geral 50MiB, seed e portas locais. `project_id = "jhconsulting"` nesse arquivo é identificador local, **não confirmação de project ref Cloud**. O Auth local permite signup, senha mínima de seis caracteres e confirmação de e-mail desativada; URLs de callback usam 127.0.0.1. Nada disso comprova configuração hospedada.

A metadata das ferramentas disponíveis confirma conector Supabase com recursos de listagem/criação de projetos, migrations, SQL, advisors e geração de tipos. **Nenhuma ferramenta de conta/projeto foi invocada nesta fase**; organização, custo, região, project ref, URL, estado e conectividade permanecem não verificados. Listar projetos e evitar duplicidade pertence à Fase 1.

O briefing informa que não existe projeto Cloud. Esta análise confirma apenas que os arquivos locais não comprovam sua existência; não substitui a checagem remota futura. Scripts e documentação locais precisam ser adequados à infraestrutura Cloud, sem executar start/reset/local.

## 8. Validação desta execução

Para evitar instalação/build volumosos na pasta sincronizada, foi criada cópia de validação em:

`C:\Users\manja\AppData\Local\Temp\jhconsulting-discovery-4e6a3d3d2531487d9c02a068ccfa75b1`

SHA-256 registrou os 51 arquivos originais. Após instalação/build, a única diferença entre a cópia e esse baseline foi `tsconfig.json`: o Next acrescentou `.next/dev/types/**/*.ts` ao include automaticamente, somente na cópia. Código-fonte, manifesto, lockfile, migrations, testes e configurações restantes coincidiram. Nenhum artefato gerado foi copiado de volta ao projeto.

| Verificação | Resultado nesta execução |
|---|---|
| `npm install --no-audit --no-fund` | PASS; 388 pacotes; lockfile inalterado |
| `npm run lint` | PASS; zero erros, um warning no export anônimo de postcss.config.mjs |
| `npm test` | PASS; 11/11 |
| `npm run build` | PASS; Next 16.3.3; home/robots/sitemap estáticos, API dinâmica |
| `npm run typecheck` após build | PASS |
| `npm ls --depth=0` | PASS; versões registradas na seção 2 |
| `npm start -- --hostname 127.0.0.1 --port 3427` | PASS; servidor de produção iniciado e encerrado |
| HTTP home/robots/sitemap | 200; conteúdo de projetos, âncoras, canonical e JSON-LD presentes |
| HTTP `/admin` e `/projetos` | 404, coerente com ausência das rotas |
| HTTP contato inválido / honeypot | 400 / 200, sem envio |
| HTTP JSON malformado | 500; defeito confirmado |
| Harness de sucesso do Contact | defeito reproduzido: loading → success → error |
| Harness da API | seis cenários previstos confirmados; exceções de JSON/SDK não tratadas reproduzidas |
| Supabase Cloud/Auth/RLS/Storage reais | N/A; fora do escopo, sem conexão |
| Resend real / e-mail entregue | N/A; não enviado |
| E2E visual/desktop/mobile | não executado |

Os 11 testes existentes cobrem configuração/chaves/cookies (oito) e escrita segura dos tipos (três); I/O de SDK, framework e CLI é simulado. Eles não testam formulário, Resend real, schema SQL, Auth real ou RLS. O harness exploratório adicional não foi incorporado à suíte e não introduziu arquivos no projeto.

O npm avisou depreciação do ESLint 9.39.5 e postinstall de `unrs-resolver` ainda não autorizado pela política npm. Não foram alteradas permissões de scripts; todos os checks acima passaram mesmo assim. Não foi executada auditoria de vulnerabilidades. Uma primeira checagem HTML falhou por conversão de acentos no pipe PowerShell→Node; foi corrigido somente o comando do teste com escapes Unicode, e a checagem passou. Isso não era falha do site.

## 9. Problemas e débitos técnicos

| Prioridade | Evidência | Encaminhamento, sem execução nesta fase |
|---|---|---|
| Alta | falso erro após sucesso no formulário | corrigir referência do formulário; Fase 13 ou correção pontual autorizada |
| Alta | JSON malformado retorna 500; SDK pode lançar sem catch | tratamento de erro controlado no contato |
| Alta | scripts start/reset/types --local | adequar à operação exclusiva Cloud; não executar fluxos locais |
| Alta | SQL no disco sem evidência de aplicação; tipos vazios | conferir projeto/histórico nas fases Cloud/schema |
| Média | rate limit por processo sem limpeza global | revisar proxy e estratégia de proteção nas Fases 13/18 |
| Média | sem Git acessível | estabelecer versionamento antes de mudanças estruturais; não inicializado aqui |
| Média | placeholders públicos e sem domínio/Resend configurados nesta cópia | definir configuração real na fase apropriada |
| Média | conteúdo institucional duplicado fora de constants | mapear consumidores completos na Fase 12 |
| Média | README recomenda Vercel; fundação orienta banco local | atualizar documentação ao novo destino Render/Cloud |
| Média | numeração antiga em docs/seed/comentários de código | usar cronograma atual: Auth 5, Storage 8, contatos 13, Render 21 |
| Média | suíte não cobre fluxos funcionais ou banco | ampliar conforme implementação; integração na Fase 17 |
| Baixa | warning PostCSS, techVisual sem uso, Node sem pin | tratar em fase apropriada, sem refatoração incidental |

`README.md`/fundação também afirmam que o schema ainda seria criado, mas já há migration de domínio no disco. O seed menciona Fase 2; o briefing atual reserva conteúdo à Fase 4. Essas divergências não autorizam pular fases nem assumir trabalho Cloud concluído.

## 10. Continuidade e relatório da fase

**OBJETIVO:** mapear o Next.js existente, fontes de conteúdo, integrações e baseline; preparar uma evolução incremental sem recriar o site.

**ESTADO INICIAL:** landing page estática, contato Resend sem persistência, fundação Supabase no código e SQL de domínio no disco; sem admin, repositories ou páginas de projetos.

**IMPLEMENTADO:** discovery atualizado, mapeamento de consumidores, inspeção dos artefatos existentes, instalação/validação isolada e reprodução dos defeitos. Nenhuma funcionalidade nova.

**SUPABASE CLOUD:** não criado, listado ou alterado. Nenhuma região escolhida nesta fase. Conector identificado; configuração real não verificada.

**ARQUIVOS CRIADOS NO PROJETO:** nenhum.

**ARQUIVOS ALTERADOS NO PROJETO:** somente `docs/ADMIN-MIGRATION-DISCOVERY.md`.

**MIGRATIONS:** três arquivos preexistentes inspecionados; nenhum criado, editado ou aplicado.

**RLS:** policies presentes no SQL preexistente; não aplicadas nem testadas nesta execução.

**TESTES:** 11/11 existentes passaram; verificações exploratórias documentam defeitos reais e seus limites.

**LINT: PASS. BUILD: PASS. TYPECHECK: PASS. STATUS GLOBAL: FAIL**, pelas falhas funcionais de contato registradas. A análise não declara o site pronto para produção.

**PROBLEMAS / DÉBITOS / ITENS FUTUROS:** seções 5–9. Correções não antecipadas além do escopo autorizado.

### Critérios de aceite

- [x] Git, árvore, dependências, scripts e configurações examinados.
- [x] Componentes, páginas, API, constants e consumidores mapeados.
- [x] Formulário, Resend, Zod, honeypot e rate limit analisados.
- [x] SEO, ambiente e gitignore inspecionados.
- [x] Trabalho Supabase existente distinguido de infraestrutura Cloud comprovada.
- [x] Instalação, lint, testes, build e typecheck executados com resultados atuais.
- [x] Conteúdo, design e código da aplicação preservados.
- [x] Somente o relatório alterado no projeto original.
- [x] Sem Docker, Supabase local, banco local, criação Cloud ou deploy nesta execução.
- [ ] Fluxo de contato sem as falhas preexistentes identificadas.

**PRÓXIMA FASE: FASE 1 — CRIAÇÃO DO PROJETO SUPABASE CLOUD.**

Somente após autorização: listar projetos pelo conector, verificar duplicidade e organização, criar/configurar o projeto Cloud em região adequada ao Brasil, validar estado/conectividade, configurar ambiente e aproveitar os clientes já existentes, ajustando o necessário. Não criar todas as tabelas nessa fase. O inventário remoto deverá preceder qualquer criação; não inferir project ref do config.toml.

A execução termina na Fase 0. **A Fase 1 não foi iniciada; aguarda autorização do usuário**, conforme o briefing atual, seções 53, 54 e “Primeira execução”.

### Referências de apoio

A evidência principal é o código em disco e os comandos desta execução. Consultados também: [eventos React](https://react.dev/reference/react-dom/components/common#react-event-object) e [changelog oficial Supabase](https://supabase.com/changelog.md). O changelog foi lido para orientar a revisão; nenhuma API ou feature Supabase nova foi implementada. A reprodução do defeito usa especificamente o React DOM instalado, não uma suposição baseada em versão antiga.