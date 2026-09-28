# 07 — O que falta

## Ações que dependem de você

Nenhuma delas pode ser feita pelo agente, porque exigem suas credenciais, seus dados ou o painel do Supabase.

| # | Ação | Onde | Por que importa |
|---|---|---|---|
| 1 | **Criar a conta de administrador** | Supabase Dashboard → Authentication → Users → Add user (com Auto Confirm). Depois avise para conceder a permissão, ou rode o SQL de [03-CONFIGURACAO.md](03-CONFIGURACAO.md) | Sem isso, ninguém entra no painel. Hoje o Auth tem **0 usuários** |
| 2 | **Preencher os contatos públicos restantes** | `/admin/configuracoes` | O WhatsApp já está configurado (`+55 (62) 99610-1996`). **E-mail, LinkedIn, GitHub e Instagram continuam vazios**, então esses links não aparecem no rodapé. O painel lista o que falta |
| 3 | **Desativar o cadastro público** | Authentication → Sign In / Providers → desmarcar "Allow new users to sign up" | Hoje qualquer pessoa pode criar conta. Não dá acesso a dado nenhum (o RLS garante), mas não há motivo para permitir |
| 4 | **Configurar a `SUPABASE_SECRET_KEY`** | Settings → API Keys → chave `sb_secret_...`, colar no `.env.local` | A Fase 13 está pronta e testada, mas **é essa chave que autoriza o servidor a gravar o lead**. Sem ela (e sem Resend) o formulário responde 503 |
| ~~5~~ | ~~**Configurar o Resend**~~ | — | **Feito.** Domínio `jhconsulting.com.br` verificado (São Paulo) e envio confirmado por um POST real em `/api/contact` (`notified: true`) |
| 6 | **Definir o domínio em produção** | `NEXT_PUBLIC_SITE_URL=https://jhconsulting.com.br` | No Render, na Fase 21. Em desenvolvimento continua `localhost:3000`; afeta canonical, sitemap e OG |
| 7 | **Rotacionar a chave do Resend** | Resend → API keys | A chave foi escrita no `.env.example` (versionado) e apareceu no chat. **Não chegou a entrar em nenhum commit**, mas o prudente é gerar outra e colar só no `.env.local` |

## Fases restantes

### Fase 18 — Hardening *(próxima)*
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
| **Média** | O rate limit identifica o cliente pelo cabeçalho `x-forwarded-for`, que só é confiável atrás de um proxy que o reescreva. No Render é o caso; em acesso direto o valor é falsificável | `src/app/api/contact/route.ts` | 18 |
| **Média** | Rate limit em memória por processo: coordena dentro de uma instância, não entre várias. A limpeza de janelas expiradas já existe | `src/app/api/contact/route.ts` | 18 |
| **Média** | Sem `engines`/`.nvmrc` fixando a versão do Node | `package.json` | 21 |
| **Média** | Access token continua válido até expirar após o logout (padrão de JWT) | Auth | 18 |
| **Baixa** | Aviso de lint em `postcss.config.mjs` (export anônimo) | — | 19 |
| **Baixa** | `AdminPlaceholder` ficou sem uso: era o marcador das seções não implementadas e todas já têm página real | `src/components/admin/AdminPlaceholder.tsx` | 19 |
| **Baixa** | `supabase/config.toml` e `.temp` são legado de Supabase local, sem efeito | `supabase/` | 19 |
| **Baixa** | Turnstile só existe como variável de ambiente; anti-spam não integrado | — | 18 |
| **Baixa** | O wordmark "JHConsulting" está em markup, então renomear a empresa no painel não muda o logo | `Navbar`, `Footer` | decisão |
| **Baixa** | `docs/SUPABASE-FOUNDATION.md` e o discovery guardam numeração antiga de fases nos comentários | `docs/` | 20 |

## Critério final do projeto

Da especificação original, o que ainda não pode ser marcado:

- [ ] Contatos persistidos no banco — **código pronto e testado**, falta a `SUPABASE_SECRET_KEY` *(sua ação #4)*
- [x] Resend funcionando de verdade — domínio verificado e envio confirmado
- [x] Conteúdo sem necessidade nenhuma de editar código *(14)*
- [ ] Auth completo com admin real criado *(sua ação #1)*
- [ ] Aplicação preparada para Render *(21)*

Já atendidos: site preservado, mesmo projeto Supabase, Postgres configurado, RLS configurado, Storage funcionando, admin protegido, projetos/serviços/tecnologias/configurações gerenciáveis, projetos públicos dinâmicos, painel de contatos com acompanhamento por status, sem Docker, sem Supabase local, sem banco local, lint e build aprovados.
