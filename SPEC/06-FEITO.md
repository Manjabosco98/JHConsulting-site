# 06 — O que foi feito

20 fases concluídas (H0 e 1 a 19), cada uma com validação, testes e commit próprio.

## Resumo

| Fase | Entrega | Commit |
|---|---|---|
| **H0** | Auditoria do estado deixado pelo agente anterior | `7b81cf4` (baseline) |
| **1** | Integração Supabase validada e encerrada | — |
| **2** | Schema de domínio aplicado no Cloud | `4fc523d` |
| **3** | RLS refatorado e matriz de acesso | `1f30bbc` |
| **4** | Conteúdo migrado das constantes para o banco | `62c4bff` |
| **5** | Login, sessão e proteção do `/admin` | `d1ab0bf` |
| **6** | Layout do painel e dashboard | `2739241` |
| **7** | CRUD de projetos | `2d01c17` |
| **8** | Storage e capa de projetos | `3e94518` |
| **9** | Projetos públicos lendo do banco | `622cecb` |
| **10** | CRUD de serviços e seção pública | `b915c83` |
| **11** | Tecnologias, grupos N:N e seção pública | `b64d3c7` |
| **12** | Configurações institucionais | `b47df61` |
| **13** | Contatos: persistência do lead e painel de atendimento | `1cdca07` |
| **14** | Fim do conteúdo duplicado no código | `aa37fbb` |
| **15** | SEO dinâmico: dados estruturados e imagem social | `d3781a0` |
| **16** | Performance e a correção de CSS que afetava o site inteiro | `fab074a` |
| **17** | Cobertura das lacunas reais, com teste de navegador | `c9a7dcb` |
| **18** | Hardening: cabeçalhos, limite de corpo, logout e guardas de segredo | `20d5f81` |
| **19** | Limpeza do legado de Supabase local e de código morto | `0d17341` |

## Detalhe por fase

### H0 — Auditoria
Descobriu que o agente anterior havia criado o projeto Cloud e os clientes Supabase, mas **nada tinha sido aplicado no banco**: 0 tabelas, 0 migrations registradas, 0 policies. O SQL existia apenas em disco. Também constatou que a pasta não era repositório Git. Documentado em `docs/HANDOFF-CODEX-CLOUD.md`.

### 1 — Integração Supabase
Já estava funcional na prática (dependências, clientes browser/servidor separados, `.env.local` correto). Validado com conexão real ao Cloud e encerrado; o relatório da fase, que estava travado em "BLOCKED", foi corrigido.

### 2 — Schema
Aplicadas as migrations de fundação e de domínio: 8 tabelas públicas + `private.admin_users`, enum de status de contato, 12 FKs/constraints, 9 índices, 7 triggers, 18 policies.

**Falha de segurança corrigida:** a migration de fundação herdada revogava apenas SELECT/INSERT/UPDATE/DELETE. Os defaults do Supabase continuavam concedendo **TRUNCATE** (que ignora RLS), REFERENCES, TRIGGER e MAINTAIN a qualquer tabela futura. Uma migration nova revogou tudo.

Validado com 12 testes de integridade em transação desfeita (publicação automática, slug inválido e duplicado, arquivado+publicado, URL `javascript:`, singleton, FK restrict, cascade, limites de contato).

### 3 — RLS
Refatoração para **uma policy permissiva por (tabela, papel, ação)**, eliminando o aviso de performance sem mudar a semântica. Criada a matriz `supabase/tests/rls_matrix.sql`.

### 4 — Seed
Migrado o conteúdo das constantes: 8 serviços, 32 tecnologias, 7 grupos, 29 membros, 3 projetos, 12 vínculos e as configurações (com a bio vinda dos parágrafos do Sobre). Idempotente por chave natural. Conferido campo a campo pela API pública contra as próprias constantes.

Contatos públicos ficaram `NULL` de propósito — eram placeholders de ambiente, não dados reais.

### 5 — Auth
Login por e-mail e senha, proxy do Next 16 renovando a sessão com `no-store`, e `requireAdmin()` validando o JWT e consultando o banco. Mensagem genérica no login (não revela se o e-mail existe), tratamento de excesso de tentativas, e conta sem permissão deslogada na hora. `/admin` com `noindex` e `Disallow`.

Comprovado por E2E que **uma sessão válida criada fora do app** não abre o painel.

### 6 — Admin base
Sidebar no desktop, navegação em linhas no mobile, header com e-mail e Sair, dashboard com números reais e aviso de configurações pendentes, e páginas protegidas para as demais seções. Padrão de repositório estabelecido.

**Corrigido:** no mobile, 3 itens do menu ficavam escondidos sem indicação de rolagem.

### 7 — Projetos
Lista com filtros (Todos, Publicados, Rascunhos, Arquivados) com contagem e busca por título; criar/editar com slug automático, três estados de publicação, destaque, ordem e tecnologias reordenáveis; exclusão com confirmação. Gravação atômica por RPC.

### 8 — Storage
Bucket `portfolio` com leitura pública por URL e escrita só para admin. Upload de capa validado por magic bytes, com rollback e remoção da imagem anterior; exclusão do projeto limpa a pasta. `next/image` restrito ao domínio do Storage.

Testado com PNGs gerados no próprio teste, incluindo uma imagem real acima de 5 MB e um SVG disfarçado.

### 9 — Projetos públicos
Seção da home, `/projetos` e `/projetos/[slug]` (SSG + sob demanda) lendo do banco, com metadata dinâmica e sitemap dinâmico. Navbar com âncoras corrigidas para páginas internas.

Comprovado que despublicar e excluir refletem no site **imediatamente**, via revalidação sob demanda.

### 10 — Serviços
CRUD com seletor de 31 ícones Lucide por allowlist e seção pública dinâmica.

**Bug corrigido:** a validação de ícone usava `in`, que aceita chaves de protótipo (`toString`). Trocado por `Object.hasOwn`.

### 11 — Tecnologias
Catálogo e grupos N:N numa página, com uso por grupo/projeto visível, e seletor ordenável compartilhado com o formulário de projetos. Exclusão de tecnologia limpa vínculos de grupo e **é bloqueada com orientação clara** quando um projeto a usa.

### 12 — Configurações
Formulário institucional (upsert do singleton) e upload da foto profissional. Metadata, JSON-LD, Hero, Sobre, Rodapé e todos os links de WhatsApp passaram a ler do banco. Campo vazio não gera link.

**Bug corrigido:** `<textarea>` envia CRLF; os parsers de configurações, projetos e serviços normalizam para `\n`.

### 13 — Contatos
O formulário do site passou a **gravar o lead antes de tentar o e-mail**. O e-mail virou notificação: uma falha de entrega não perde o contato, e uma falha de gravação não impede o aviso. A requisição só falha (503) quando **os dois** caminhos falham — o único caso em que faz sentido pedir ao visitante para usar outro canal.

`/admin/contatos` com abas por status e contagem, detalhe com a mensagem completa, botões de responder por e-mail e abrir no WhatsApp, e alteração de status. O painel avisa, na própria página, quando a `SUPABASE_SECRET_KEY` ou o Resend não estão configurados.

**Três defeitos conhecidos corrigidos:**
- o formulário mostrava erro mesmo quando o envio dava certo (`e.currentTarget` fica nulo depois do `await`);
- JSON malformado no endpoint virava 500, agora é 400;
- exceção do SDK do Resend não era tratada.

**Sem migration:** os grants e policies de `contacts` já existiam desde a Fase 2. A matriz de RLS ganhou 3 casos que reproduzem exatamente o que o código executa.

**Limite em aberto:** o lead só é gravado quando a `SUPABASE_SECRET_KEY` estiver no ambiente. Comprovado por E2E que, sem ela e sem Resend, o endpoint responde 503 `unavailable` em vez de fingir sucesso.

### 14 — Fim do conteúdo duplicado
Saíram de `src/constants/content.ts` os projetos, serviços e tecnologias (e o `techVisual`, que não tinha consumidor). `src/constants/site.ts` ficou reduzido a `name`, `url` e `nav`: e-mail, WhatsApp e redes sociais saíram do código e das variáveis de ambiente, porque a fonte de verdade é `/admin/configuracoes`.

**A decisão que faltava:** em falha de consulta, a seção mostra o estado neutro que já existia em vez de dado embutido. O raciocínio está em [05-ESTRATEGIAS.md](05-ESTRATEGIAS.md) — resumidamente, depois que o painel começa a ser usado a cópia do build vira informação errada, e o ISR já protege contra indisponibilidade momentânea servindo a última renderização boa.

As configurações institucionais degradam para um objeto com apenas a marca preenchida, cenário inalcançável na prática porque a linha é singleton e nenhum papel consegue apagá-la.

Comprovado pelas mesmas 201 verificações E2E: a home continua mostrando os 8 serviços, os 3 projetos e os 7 grupos de tecnologia, agora sem nenhum dado embutido.

### 15 — SEO dinâmico
- **Dados estruturados por projeto**: `CreativeWork` (título, resumo, capa, categoria, tecnologias como keywords, datas de publicação e alteração, autor e organização) e `BreadcrumbList` de Início → Projetos → projeto. O componente `JsonLd` centraliza a serialização e escapa `<`, o que impede texto editado no painel de escapar da tag `<script>`.
- **Imagem social padrão** gerada em `/opengraph-image` a partir das configurações, em vez de um PNG versionado: renomear a empresa ou mudar o cargo no painel muda a imagem, sem ferramenta de design e sem deploy.
- **Descoberta durante a fase:** uma página que declara o próprio `openGraph` substitui o do pai, **inclusive a imagem** que a convenção de arquivo forneceria. As páginas de projeto e a listagem ficavam sem imagem social nenhuma. `DEFAULT_OG_IMAGE` resolve, e o E2E passou a verificar.
- **`lastModified` do sitemap** deixou de ser o instante da renderização (que anunciava mudança em toda revalidação) e passou a refletir a alteração real de conteúdo.
- **`description` e título da listagem** passaram a vir do painel, então a meta description da home é editável sem deploy.

### 16 — Performance
**O `font: inherit` era maior do que parecia.** O bloco de resets do `globals.css` estava fora de `@layer`, e no Tailwind 4 CSS sem layer vence **qualquer** utilitário. Medindo o estilo computado na página real, `a.text-blue-300` renderizava **branco**: todo link com cor de utilitário estava perdendo a cor, não só o botão perdendo o negrito. Mover os resets para `@layer base` devolveu link azul e botão em negrito, sem afetar as classes de componente (`.section-title` etc., que continuam fora de layer de propósito).

**Motion removido.** A dependência custava ~120 KB de JavaScript no cliente e era usada em **um** lugar: o fade de entrada dos cards de Serviços. Trocada por IntersectionObserver + transição CSS, com a mesma distância, duração, atraso e comportamento de animar só uma vez. O JavaScript da home caiu de **705 KB para 589 KB** (não comprimido). Uma regra em `<noscript>` mantém o conteúdo visível com JavaScript desligado — o que antes não acontecia.

**Revisado e mantido como está:** ISR de 1h com revalidação sob demanda; consultas públicas (uma por seção, sem N+1); contagens do painel em paralelo; `next/image` com `sizes` e allowlist restrita ao domínio do Storage; fontes do sistema, sem webfont. Só três componentes de cliente no site público: `Navbar`, `Contact` e `Reveal`.

### 17 — Testes
Em vez de inflar a contagem, a fase começou por um levantamento de quais módulos nenhum teste carregava. As lacunas reais eram três.

**Repositórios públicos** (`public-projects`, `public-services`, `public-technologies`): agora têm testes de ordenação por `display_order`, descarte de vínculo cujo lado visível o RLS escondeu, capa virando URL, mapeamento do detalhe e propagação de erro — inclusive a garantia de que `listPublishedProjectSlugs` **nunca lança**, da qual dependem o sitemap e o `generateStaticParams`.

**A decisão da Fase 14 não tinha teste.** Agora cada seção pública é renderizada com o repositório falhando, e o teste exige que apareça o estado neutro e que **não** apareça dado embutido.

**Teste de navegador** para o formulário público, o defeito mais visível que o projeto teve. Ele não era detectável por HTTP: só aparece quando o React executa o handler. Cobre sucesso, 429, 503, queda de rede e o estado do botão, com o `fetch` da página substituído — nenhum e-mail sai e nada é gravado.

**O teste foi verificado por mutação:** reintroduzi o bug numa cópia e confirmei que a suíte acusa exatamente `"Não foi possível enviar agora"` depois de um envio aceito, enquanto os casos de erro continuam passando. Na primeira tentativa a mutação foi feita com `Get-Content`/`Set-Content` do PowerShell 5.1, que corrompeu os acentos do arquivo e invalidou o experimento — refeito lendo e gravando UTF-8 explicitamente.

O helper `loadTs` passou a resolver `.tsx` além de `.ts`, o que é o que permite testar componentes.

### 18 — Hardening
**O site não enviava nenhum cabeçalho de segurança.** Medi antes de escrever: só `x-robots-tag` no painel. Agora todas as rotas enviam CSP (`frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`), `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e `Cross-Origin-Opener-Policy`. HSTS entra **apenas** quando o site é HTTPS — em `localhost` seria um tiro no pé.

Ficou de fora, conscientemente, a CSP de `script-src`: exigiria nonce por requisição, com risco real de quebra e pouco ganho num site sem incorporações de terceiros.

**Endpoint de contato:** o corpo passou a ser lido com teto de 64 KB medindo o **stream**, não só o `Content-Length` — senão uma requisição *chunked* passava direto. E o cliente do rate limit passou a ser o **último** hop de `x-forwarded-for`, que é o endereço que o proxy mais próximo observou; o primeiro é totalmente controlado por quem envia.

**Logout** passou a usar escopo `global`: os refresh tokens são revogados no servidor, não só apagados do cookie. Um token capturado antes do logout deixa de poder ser renovado. O login de conta sem permissão continua com escopo local, porque a conta é de quem se autenticou.

**Guardas estáticos de segredo**, que leem o código em vez de executá-lo: nenhuma variável `NEXT_PUBLIC_` com nome de segredo, ninguém lê variável de servidor sem `server-only`, nenhum componente de cliente toca nelas, e **o `.env.example` não pode conter valor com cara de credencial** — exatamente o deslize que aconteceu nesta sessão.

**Alertas do Supabase:** dois. O de `private.admin_users` sem policy é intencional (negação total pela API). O outro, proteção contra senha vazada desligada, virou ação sua.

### 19 — Limpeza
Saíram `supabase/config.toml` e `supabase/seed.sql`. Não era só arquivo inútil: o `config.toml` descrevia um ambiente local que não existe e trazia `project_id = "jhconsulting"`, que **não é o ref do projeto Cloud** — exatamente o tipo de pista falsa que faria alguém apontar para o lugar errado. Em `supabase/` restaram as migrations e a matriz de RLS. O `.temp` da CLI, que era ignorado pelo Git, saiu do disco.

Saiu também o `AdminPlaceholder`, marcador das seções ainda não implementadas — todas têm página real desde a Fase 13.

As variáveis do Turnstile saíram do `.env.example`: eram configuração morta há 19 fases. Integrar um captcha depois é decidir por uma funcionalidade, não reativar código.

`postcss.config.mjs` passou a exportar uma constante nomeada, e com isso **o lint ficou sem nenhum aviso** — era o único que sobrava desde o início do projeto.

Conferido que toda dependência declarada é realmente importada; nenhuma sobrou.

## Estado atual do Cloud

| Item | Estado |
|---|---|
| Migrations aplicadas | 10, espelhadas em `supabase/migrations/` |
| Tabelas | 8 públicas + `private.admin_users` |
| Policies | 36 em `public` + 4 em `storage.objects` |
| Funções | `is_admin`, `admin_save_project`, `admin_save_technology_group`, `admin_delete_technology` |
| Conteúdo | 3 projetos, 8 serviços, 32 tecnologias, 7 grupos, 29 membros, 12 vínculos, 1 configuração |
| Contatos | 0 (a persistência está pronta; falta a `SUPABASE_SECRET_KEY`) |
| Storage | bucket `portfolio`, 0 objetos |
| Usuários | 0 (a conta admin ainda será criada por você) |
| Advisors de segurança | apenas 1 INFO intencional (`admin_users` sem policy) |

## Qualidade

| Verificação | Resultado |
|---|---|
| `npm test` | **136/136** |
| `npm run test:browser` | **12/12** |
| JavaScript da home | **589 KB** não comprimido (era 705 KB antes da Fase 16) |
| Matriz de RLS | **89/89** (última execução na Fase 13; nada depois dela tocou schema, grants, policies ou funções) |
| Advisors do Supabase | 1 INFO intencional + 1 WARN que virou ação sua |
| E2E (8 suítes) | **228/228** — auth 32, projetos 22, storage 23, público 45, serviços 21, tecnologias 28, configurações 28, contatos 29 |
| `npm run lint` | PASS, **sem nenhum aviso** (o último saiu na Fase 19) |
| `npm run build` | PASS |
| `npm run typecheck` | PASS |

Todas as fases foram conferidas também visualmente, por screenshots em desktop (1440px) e mobile (390px).
