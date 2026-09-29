# 07 — O que falta

## Ações que dependem de você

Nenhuma delas pode ser feita pelo agente, porque exigem suas credenciais, seus dados ou o painel do Supabase.

| # | Ação | Onde | Por que importa |
|---|---|---|---|
| ~~1~~ | ~~**Criar a conta de administrador**~~ | — | **Feito.** `manjabosco98@gmail.com` criado e com permissão ativa em `private.admin_users` |
| 2 | **Preencher os contatos públicos restantes** | `/admin/configuracoes` | O WhatsApp já está configurado (`+55 (62) 99610-1996`). **E-mail, LinkedIn, GitHub e Instagram continuam vazios**, então esses links não aparecem no rodapé. O painel lista o que falta |
| 3 | **Desativar o cadastro público** | Authentication → Sign In / Providers → desmarcar "Allow new users to sign up" | Hoje qualquer pessoa pode criar conta. Não dá acesso a dado nenhum (o RLS garante), mas não há motivo para permitir |
| ~~4~~ | ~~**Configurar a `SUPABASE_SECRET_KEY`**~~ | — | **Feito.** Gravação confirmada por envio real (`stored: true`) e pela suíte de contatos, que passou a exercitar o caminho com gravação (31 verificações, contra 29 sem a chave) |
| ~~5~~ | ~~**Configurar o Resend**~~ | — | **Feito.** Domínio `jhconsulting.com.br` verificado (São Paulo) e envio confirmado por um POST real em `/api/contact` (`notified: true`) |
| 6 | **Definir o domínio em produção** | `NEXT_PUBLIC_SITE_URL=https://jhconsulting.com.br` nas variáveis do Render | Em desenvolvimento continua `localhost:3000`. Já validado: com a URL de produção, canonical, OG, sitemap e HSTS saem corretos |
| 7 | **Rotacionar a `SUPABASE_SECRET_KEY`** | Supabase → Settings → API Keys | A do Resend **já foi rotacionada**. Falta a do Supabase, que é a mais sensível porque ignora o RLS. Ela passou pelo `.env.example` e pelo chat; **nunca entrou em commit** (verificado com `git log -S`). Ao gerar a nova, cole **no `.env.local`** |
| 8 | **Ligar a proteção contra senha vazada** | Authentication → Policies | Alerta do próprio Supabase. Compara a senha com a base do HaveIBeenPwned. Com uma conta só, protegida por senha, é barato e vale |
| 9 | **Encurtar a validade do access token** | Authentication → Sessions (JWT expiry) | O padrão é 1h. Depois do logout o refresh já é revogado (Fase 18); esse ajuste reduz a janela do token que ainda está em circulação |

## Fases restantes

**Nenhuma.** As 21 fases foram concluídas (H0 e 1 a 21) — o detalhe de cada uma está em [06-FEITO.md](06-FEITO.md).

O que resta é **o deploy em si**, que depende da sua autorização e das ações da tabela acima. O essencial de configuração vive no `README.md`, seção "Produção futura".

## Dívida técnica conhecida

Registrada, não esquecida:

| Prioridade | Item | Onde | Fase |
|---|---|---|---|
| **Média** | Rate limit em memória por processo: coordena dentro de uma instância, não entre várias. A limpeza de janelas expiradas e a leitura do último hop já existem | `src/app/api/contact/route.ts` | quando houver mais de uma instância |
| **Baixa** | Sem CSP de `script-src`: exigiria nonce por requisição. As diretivas sem nonce já estão aplicadas | `next.config.ts` | decisão |
| **Baixa** | Access token continua válido até expirar após o logout (padrão de JWT). O refresh já é revogado; o resto é a configuração da ação #9 | Auth | sua ação #9 |
| **Baixa** | Anti-spam é só honeypot + rate limit. As variáveis do Turnstile saíram na Fase 19 por serem configuração morta; integrar um captcha depois é decidir por uma funcionalidade, não reativar código | — | decisão |
| **Baixa** | O wordmark "JHConsulting" está em markup, então renomear a empresa no painel não muda o logo | `Navbar`, `Footer` | decisão |
| **Baixa** | `docs/SUPABASE-FOUNDATION.md` e o discovery guardam numeração antiga de fases nos comentários | `docs/` | 20 |

## Critério final do projeto

Da especificação original, o que ainda não pode ser marcado:

- [x] Contatos persistidos no banco — confirmado em operação, com a chave configurada
- [x] Resend funcionando de verdade — domínio verificado e envio confirmado
- [x] Conteúdo sem necessidade nenhuma de editar código *(14)*
- [ ] Auth completo com admin real criado *(sua ação #1)*
- [x] Aplicação preparada para Render — build e start validados a partir de clone limpo *(21)*; **o deploy em si continua dependendo da sua autorização**

Já atendidos: site preservado, mesmo projeto Supabase, Postgres configurado, RLS configurado, Storage funcionando, admin protegido, projetos/serviços/tecnologias/configurações gerenciáveis, projetos públicos dinâmicos, painel de contatos com acompanhamento por status, sem Docker, sem Supabase local, sem banco local, lint e build aprovados.
