# Deploy no Render

Preparação da Fase 21. **Nenhum deploy foi feito**; este documento e o `render.yaml` na raiz descrevem o que fazer quando houver autorização.

## O que já foi validado

A partir de um **clone limpo do repositório**, sem `.env.local` — exatamente a situação do Render:

| Passo | Resultado |
|---|---|
| `npm ci` | 33 s, sem erro |
| `npm run build` com as variáveis vindas do ambiente | 37 s, 22 páginas geradas |
| `npm start` com `PORT` definido | respeita a porta do ambiente e escuta em todas as interfaces |
| `NEXT_PUBLIC_SITE_URL=https://jhconsulting.com.br` | canonical, `og:image`, `robots.txt` e `sitemap.xml` saem no domínio real |
| HSTS | aparece **só** com site HTTPS; em `localhost` continua ausente |

Ou seja: o par build/start funciona sem nenhum arquivo de ambiente no disco, que é a premissa do Render.

## Configuração do serviço

| Campo | Valor |
|---|---|
| Tipo | Web Service, runtime **Node** (sem Docker) |
| Build | `npm ci && npm run build` |
| Start | `npm start` |
| Health check | `/robots.txt` (estático e barato) |
| Node | 24 — fixado em `.nvmrc`, em `engines` no `package.json` e em `NODE_VERSION` |
| Auto deploy | **desligado**: cada publicação é uma decisão |

`next start` lê a variável `PORT` que o Render injeta; não passe `--port`.

### Variáveis de ambiente

Necessárias **no build**, porque as páginas públicas leem do banco e o `next/image` monta a allowlist a partir da URL:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` → `https://jhconsulting.com.br`

Necessárias em execução:

- `SUPABASE_SECRET_KEY` — sem ela o formulário funciona, mas o lead não é gravado
- `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL` — aviso por e-mail

Opcional: `NEXT_PUBLIC_GA_ID`.

Nenhum valor real entra no `render.yaml` nem no repositório: todos ficam marcados como `sync: false` e são preenchidos no painel.

## Depois de publicar

1. **Supabase → Authentication → URL Configuration**: apontar a Site URL para `https://jhconsulting.com.br`. Login por senha não depende de redirect URLs; recuperação de senha, se um dia existir, dependerá.
2. **Domínio no Render** com HTTPS. Só a partir daí o HSTS passa a ser emitido — e ele instrui o navegador a exigir HTTPS por dois anos, então confirme que o certificado está ativo antes de divulgar o domínio.
3. Conferir `/robots.txt` e `/sitemap.xml` no domínio real e enviar o sitemap ao Search Console.
4. Rodar as verificações contra o domínio: `E2E_BASE_URL=https://jhconsulting.com.br` nas suítes públicas. **Não** rodar as suítes de admin contra produção: elas criam e apagam conteúdo.

## Latência: o ponto que merece atenção

O Render não tem região no Brasil. A mais próxima do Supabase (`sa-east-1`, São Paulo) é **Virginia**, e ainda assim cada consulta atravessa o continente.

Na prática isso pesa pouco no site público, porque ele é servido por ISR: as páginas ficam em cache por 1 hora e são revalidadas sob demanda quando você edita algo. Quem sente a distância é o **painel**, que consulta o banco a cada requisição por depender da sessão. É um custo aceitável para o volume deste projeto — mas é a primeira coisa a revisitar se o `/admin` parecer lento.

## Storage

Nada é gravado no disco do Render: uploads vão para o bucket `portfolio` do Supabase Storage. O filesystem do Render é efêmero, então essa separação não é preferência, é requisito.

## Antes do primeiro deploy

Pendências que independem do Render e estão listadas em [`SPEC/07-PENDENCIAS.md`](../SPEC/07-PENDENCIAS.md): criar a conta de administrador, definir a `SUPABASE_SECRET_KEY`, rotacionar a chave do Resend, desativar o cadastro público no Auth e completar e-mail e redes em `/admin/configuracoes`.
