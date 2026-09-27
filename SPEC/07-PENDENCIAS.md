# 07 — O que falta

## Ações que dependem de você

Nenhuma delas pode ser feita pelo agente, porque exigem suas credenciais, seus dados ou o painel do Supabase.

| # | Ação | Onde | Por que importa |
|---|---|---|---|
| 1 | **Criar a conta de administrador** | Supabase Dashboard → Authentication → Users → Add user (com Auto Confirm). Depois avise para conceder a permissão, ou rode o SQL de [03-CONFIGURACAO.md](03-CONFIGURACAO.md) | Sem isso, ninguém entra no painel. Hoje o Auth tem **0 usuários** |
| 2 | **Preencher os contatos públicos** | `/admin/configuracoes` | E-mail, WhatsApp, LinkedIn, GitHub e Instagram estão vazios, então esses links **não aparecem** no site. O painel lista o que falta |
| 3 | **Desativar o cadastro público** | Authentication → Sign In / Providers → desmarcar "Allow new users to sign up" | Hoje qualquer pessoa pode criar conta. Não dá acesso a dado nenhum (o RLS garante), mas não há motivo para permitir |
| 4 | **Configurar a `SUPABASE_SECRET_KEY`** | Settings → API Keys → secret, colar no `.env.local` | **Bloqueia a Fase 13**: é a chave que o servidor usa para gravar os contatos |
| 5 | **Configurar o Resend** | `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` | Hoje o formulário responde 503 localmente. Precisa de domínio verificado no Resend |
| 6 | **Definir o domínio** | `NEXT_PUBLIC_SITE_URL` | Hoje aponta para localhost; afeta canonical, sitemap e OG |

## Fases restantes

### Fase 13 — Contatos *(próxima)*
- Persistir o lead no banco **antes** de enviar o e-mail, com a `service_role` restrita às colunas do formulário.
- Definir o comportamento quando a gravação funciona e o Resend falha: **não perder o lead**.
- Corrigir os três defeitos conhecidos do formulário (abaixo).
- `/admin/contatos`: lista, filtro por status, detalhe e mudança de status (NEW → CONTACTED → NEGOTIATING → CONVERTED / ARCHIVED).

**Bloqueio:** ação #4 da tabela acima.

### Fase 14 — Remover hardcode
Após tudo validado: remover de `src/constants/content.ts` o que já vive no banco (projetos, serviços, tecnologias) e limpar as variáveis de ambiente de contato que hoje são só fallback.

**Cuidado:** as seções públicas usam as constantes como fallback em caso de erro. Remover exige decidir o que acontece numa falha de consulta — provavelmente esconder a seção em vez de mostrar dado velho. Decisão a documentar.

### Fase 15 — SEO dinâmico
JSON-LD por projeto, Open Graph com a capa, imagem OG padrão, refino de canonical e do sitemap.

### Fase 16 — Performance
Revisar cache, queries, bundle e imagens. **Inclui a correção do `font: inherit`** (abaixo), que afeta o site público.

### Fase 17 — Testes
Ampliar cobertura dos fluxos críticos, especialmente o formulário de contato. Sem Docker e sem banco local.

### Fase 18 — Hardening
Revisar Auth (inclusive o tempo de vida do access token após logout), RLS, segredos, uploads, APIs, formulários e rate limit.

### Fase 19 — Limpeza
Remover `supabase/config.toml` e `supabase/.temp` (legado de Supabase local), `techVisual` (constante sem consumidor) e dependências obsoletas.

### Fase 20 — Documentação
Atualizar README e `docs/`, e revisar esta pasta SPEC.

### Fase 21 — Preparação para Render
Fixar versão do Node (`engines`/`.nvmrc`), validar build/start, configurar variáveis, URLs do Auth, domínio e Storage. **Deploy só com sua autorização.**

## Dívida técnica conhecida

Registrada, não esquecida:

| Prioridade | Item | Onde | Fase |
|---|---|---|---|
| **Alta** | Formulário mostra erro mesmo quando o envio dá certo (`e.currentTarget` acessado depois do `await`) | `src/components/sections/Contact.tsx` | 13 |
| **Alta** | JSON malformado no endpoint de contato retorna 500 | `src/app/api/contact/route.ts` | 13 |
| **Alta** | Exceção do SDK do Resend sem tratamento | `src/app/api/contact/route.ts` | 13 |
| **Média** | `globals.css` declara `font: inherit` em botões fora de `@layer`, o que vence utilitários do Tailwind 4. O painel contorna aplicando a fonte no elemento pai; o botão do formulário público perdeu o negrito | `src/app/globals.css` | 16 |
| **Média** | Rate limit em memória por processo, sem limpeza nem coordenação entre instâncias | `src/app/api/contact/route.ts` | 13/18 |
| **Média** | Sem `engines`/`.nvmrc` fixando a versão do Node | `package.json` | 21 |
| **Média** | Access token continua válido até expirar após o logout (padrão de JWT) | Auth | 18 |
| **Baixa** | Aviso de lint em `postcss.config.mjs` (export anônimo) | — | 19 |
| **Baixa** | `techVisual` em `content.ts` não tem consumidor | `src/constants/content.ts` | 19 |
| **Baixa** | `supabase/config.toml` e `.temp` são legado de Supabase local, sem efeito | `supabase/` | 19 |
| **Baixa** | Turnstile só existe como variável de ambiente; anti-spam não integrado | — | 18 |
| **Baixa** | O wordmark "JHConsulting" está em markup, então renomear a empresa no painel não muda o logo | `Navbar`, `Footer` | decisão |
| **Baixa** | `docs/SUPABASE-FOUNDATION.md` e o discovery guardam numeração antiga de fases nos comentários | `docs/` | 20 |

## Critério final do projeto

Da especificação original, o que ainda não pode ser marcado:

- [ ] Contatos persistidos no banco *(13)*
- [ ] Resend funcionando de verdade *(13 + sua ação #5)*
- [ ] Conteúdo sem necessidade nenhuma de editar código *(14)*
- [ ] Auth completo com admin real criado *(sua ação #1)*
- [ ] Aplicação preparada para Render *(21)*

Já atendidos: site preservado, mesmo projeto Supabase, Postgres configurado, RLS configurado, Storage funcionando, admin protegido, projetos/serviços/tecnologias/configurações gerenciáveis, projetos públicos dinâmicos, sem Docker, sem Supabase local, sem banco local, lint e build aprovados.
