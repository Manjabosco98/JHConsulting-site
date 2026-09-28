# 06 — O que foi feito

14 fases concluídas (H0 e 1 a 13), cada uma com validação, testes e commit próprio.

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
| `npm test` | **108/108** |
| Matriz de RLS | **89/89** |
| E2E (8 suítes) | **201/201** — auth 32, projetos 22, storage 23, público 19, serviços 21, tecnologias 28, configurações 28, contatos 28 |
| `npm run lint` | PASS (1 aviso preexistente em `postcss.config.mjs`) |
| `npm run build` | PASS |
| `npm run typecheck` | PASS |

Todas as fases foram conferidas também visualmente, por screenshots em desktop (1440px) e mobile (390px).
