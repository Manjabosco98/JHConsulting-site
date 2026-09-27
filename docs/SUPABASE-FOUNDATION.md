# FASE 1 — CRIAÇÃO DO PROJETO SUPABASE CLOUD

Data: 27/09/2026. **STATUS: PASS** (encerrada na auditoria H0, ver `docs/HANDOFF-CODEX-CLOUD.md`). O relatório abaixo registra o estado intermediário "BLOCKED" em que o agente anterior parou; o bloqueio foi superado.

## Encerramento (H0 / início da Fase 2)

- Projeto criado: **jhconsulting-site**, ref `qlgxzpowqijcvnwuqchh`, `sa-east-1`, `ACTIVE_HEALTHY`, PostgreSQL 17. Único projeto da organização; usar sempre este.
- URL: `https://qlgxzpowqijcvnwuqchh.supabase.co`.
- `.env.local` configurado com URL, chave publishable e `SUPABASE_PROJECT_ID` (valores não versionados).
- Conectividade real validada com a chave pública: Auth health/settings 200, Storage e REST respondendo.

---

## Objetivo e estado inicial

Preparar Supabase Cloud e conectar o Next.js existente, sem criar tabelas de domínio, Auth administrativo ou Storage nesta fase. Já existiam clientes browser/server, dependências fixadas, tipos base, testes, configuração local e migrations não verificadas no Cloud. O site público e o contato continuam com o comportamento registrado no discovery.

## Consulta pelo conector

- `list_projects`: lista vazia; nenhum projeto disponível e nenhuma duplicidade encontrada nesta consulta.
- `list_organizations`: uma organização, **Manjabosco**, ID `ovrzfpufbbfktbekmesd`.
- Projeto proposto: **jhconsulting-site**.
- Região proposta: **sa-east-1 (São Paulo)**, adequada ao público brasileiro. Ainda não provisionada.
- `get_cost` para essa organização: **amount 0, recurrence monthly**. O custo foi informado ao usuário e o recurso `confirm_cost` retornou identificador de confirmação, mantido fora do documento.
- A ferramenta `create_project` exige perguntar a organização ao usuário. A pergunta foi enviada; enquanto a escolha estiver pendente, o projeto não será criado.

**Project ID, URL, estado operacional e conectividade Cloud: pendentes.** Nenhuma chave, senha, usuário, bucket ou recurso remoto foi criado. Nenhuma migration foi aplicada. Não existe `.env.local` real nesta etapa parcial.

## Implementação local concluída

- Preservados `@supabase/supabase-js` **2.117.2** e `@supabase/ssr` **0.12.7**, fixados no manifesto/lockfile. `npm view` confirmou que são as versões atuais; SSR aceita supabase-js `^2.114.0` e o SDK exige Node `>=22.0.0`. Ambiente validado: Node 24.20.0/npm 11.19.0.
- Clientes existentes reaproveitados: browser marcado `client-only`, servidor marcado `server-only`, cliente por requisição com cookies do Next. Ambos usam somente configuração pública; nenhuma chave privilegiada.
- URL Supabase passa a exigir HTTPS; HTTP local deixa de ser aceito. Validação continua lazy, sem exigir Supabase para construir a home estática.
- Comentário do cliente servidor ajustado à Fase 5, quando serão implementados Proxy/renovação de sessão, login e autorização. A factory atual não protege rotas.
- Removidos scripts npm de Supabase local: start, stop, status e db:reset.
- Gerador de tipos exige `SUPABASE_PROJECT_ID` explícito e usa `--project-id ... --schema public`. Não há fallback local. A gravação temporária preserva os tipos anteriores em caso de falha.
- Testes do gerador cobrem ausência de project ref e argumentos remotos. Teste da configuração rejeita URL HTTP local.
- `.env.example` documenta Cloud, chave publishable, project ref e secret reservada. Valores reais não foram incluídos.
- README atualizado para Supabase Cloud no desenvolvimento e produção futura no Render/Node, sem Docker.

O conector é o meio preferencial para operações suportadas, incluindo futura geração de tipos. O script CLI é alternativa de manutenção para usuário autenticado: a variável `SUPABASE_PROJECT_ID` deve ser exportada no terminal, pois npm não carrega `.env.local` automaticamente. Nenhuma introspecção real foi executada nesta fase parcial.

## Arquivos

**Criados no projeto:** nenhum até esta etapa.

**Alterados:**

- `package.json`;
- `.env.example`;
- `README.md`;
- `src/lib/supabase/env.ts`;
- `src/lib/supabase/server.ts`;
- `scripts/generate-supabase-types.mjs`;
- `tests/supabase.test.mjs`;
- `tests/generate-types.test.mjs`;
- `docs/SUPABASE-FOUNDATION.md`.

**Preservados:** design, componentes públicos, constantes, contato/Resend, SEO, lockfile, tipos base, seed e migrations. O discovery permanece como registro da Fase 0. Nenhum arquivo com segredo foi criado ou versionado.

`supabase/config.toml` é um artefato local preexistente, sem efeito no projeto Cloud. Não deve ser executado ou aplicado. Sua limpeza poderá ser feita em fase própria; nenhum comando local foi chamado. O seed continua apenas comentários.

## Validação local

A validação usa a cópia temporária já instalada em `C:\Users\manja\AppData\Local\Temp\jhconsulting-discovery-4e6a3d3d2531487d9c02a068ccfa75b1`, atualizada com os arquivos desta fase. Não foi criado banco local ou temporário.

| Check | Resultado |
|---|---|
| Versões/compatibilidade via npm registry | PASS; versões Supabase atuais e compatíveis |
| `npm test` | PASS; 13/13, com mocks de I/O |
| `npm run lint` | PASS; zero erros, um warning preexistente no PostCSS |
| `npm run build` | PASS; Next 16.3.3, sem env Cloud ainda |
| Criação/provisionamento Cloud | pendente da escolha de organização |
| Conexão Next.js → Supabase Cloud | não executada; projeto ainda não criado |
| PostgreSQL remoto | não consultado |
| Login/RLS/Storage reais | fora desta fase |

Os testes não comprovam conectividade ou autenticação real. O build mantém `/`, `/_not-found`, `/api/contact`, `/robots.txt` e `/sitemap.xml`. Foram executados apenas comandos de ajuda da CLI, sem iniciar serviços locais. Uma primeira tentativa de localizar o executável CLI por caminho direto falhou; a ajuda foi consultada corretamente via `npm exec --no -- supabase`.

## Migrations e RLS

Nenhuma migration criada, alterada ou aplicada. Os três arquivos SQL preexistentes não representam, por si, estado Cloud aplicado. O schema pertence à Fase 2; a revisão de policies à Fase 3. Nunca expor tabelas antes de definir as permissões adequadas.

## Problemas e débitos técnicos

As falhas de contato encontradas no discovery permanecem abertas: falso erro depois do sucesso da API, parse JSON sem tratamento e exceções SDK sem catch. Esta preparação não modifica o fluxo Resend. Também permanecem ausência de Git, warning PostCSS e configuração local legada, todos documentados.

Não foi feita auditoria de dependências, envio de e-mail, alteração de Auth, criação de tabela/bucket ou deploy. O build aprovado não equivale ao gate funcional global do site aprovado.

## Critérios de aceite e continuidade

- [x] Projetos existentes listados pelo conector e duplicidade verificada.
- [x] Organização disponível identificada e custo consultado/informado.
- [x] Região proposta com justificativa para público brasileiro.
- [x] Dependências atuais/compatíveis e clientes browser/server separados.
- [x] Scripts ajustados para Cloud, com testes, lint e build aprovados.
- [ ] Organização escolhida pelo usuário e projeto criado.
- [ ] Projeto operacional, URL/project ref registrados e PostgreSQL acessível.
- [ ] `.env.local` configurado com chave pública real, preservando variáveis existentes.
- [ ] Conexão do Next.js com Supabase Cloud validada.
- [ ] Validação final e relatório da Fase 1 concluídos.

A próxima ação é **continuar a própria Fase 1** assim que o usuário confirmar a organização. Depois de concluir os itens pendentes, parar antes da **FASE 2 — SCHEMA DO BANCO NO SUPABASE CLOUD** e aguardar nova autorização.

## Referências

- [Clientes SSR oficiais](https://supabase.com/docs/guides/auth/server-side/creating-a-client), consultados pelo conector.
- [Changelog Supabase](https://supabase.com/changelog.md), consultado nesta sessão.
- Versões e peer dependencies confirmados pelo npm registry; ajuda da CLI instalada confirmou `--project-id` e `--schema`.