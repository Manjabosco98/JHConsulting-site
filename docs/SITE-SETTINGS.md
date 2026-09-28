# Configurações do site (Fase 12)

A linha singleton `public.site_settings` (id = 1) alimenta a identidade, o contato público e as redes sociais do site.

## Painel

`/admin/configuracoes` tem dois formulários:

| Formulário | Campos |
|---|---|
| Foto profissional | upload/remoção da imagem exibida na seção Sobre (Storage, `settings/<uuid>.<ext>`) |
| Configurações | **Identidade** (empresa, profissional, cargo, descrição, bio) · **Contato público** (e-mail, WhatsApp, telefone, localização, área de atendimento) · **Redes sociais** (LinkedIn, GitHub, Instagram) |

- A gravação é um **upsert** da linha 1: funciona mesmo se ela não existir.
- Campos opcionais vazios são gravados como `NULL`, e **o que está vazio não aparece no site** (o rodapé não renderiza o ícone).
- A página avisa quais contatos públicos ainda estão sem preenchimento; o dashboard mostra o mesmo alerta.
- Quebras de linha de textarea chegam como CRLF pelo formulário; os parsers normalizam para `\n` antes de gravar (vale também para projetos e serviços).
- A foto segue o mesmo fluxo da capa de projeto: objeto novo imutável → aponta a linha → remove o anterior; se a gravação falhar, o objeto novo é apagado.

## Consumidores públicos

`getSiteSettings()` (`src/lib/repositories/public-settings.ts`) é memoizado por requisição (`cache`) e **nunca lança**. Desde a Fase 14 não existe fallback para constants ou variáveis de ambiente: sem a linha, ou em erro de consulta, devolve um objeto **degradado** com apenas `companyName` preenchido (a marca, que também é o wordmark da marcação) e registra o erro. Na prática é inalcançável — a linha é singleton, criada pelo seed, e nenhum papel consegue apagá-la.

| Consumidor | Usa |
|---|---|
| `layout.tsx` (`generateMetadata`) | nome da empresa no title/template/OG, descrição |
| `page.tsx` (JSON-LD) | nome, profissional, descrição, e-mail, telefone, foto, `sameAs`, endereço (de `location`) |
| `Hero` | nome do profissional e cargo; link do WhatsApp |
| `About` | parágrafos da bio, localização, área de atendimento, foto (ou placeholder) |
| `Footer` | nome da empresa no copyright, LinkedIn, GitHub, Instagram, e-mail |
| `PrimaryCTA`, `WhatsAppButton`, `Navbar` | link do WhatsApp (`src/lib/whatsapp.ts`) |

- A `Navbar` é client component: recebe `whatsappUrl` já resolvido no servidor.
- A **marca** ("JH" + "Consulting") continua em markup: é tratamento de logo, não dado. Mudar o nome da empresa no painel altera metadata e copyright, não o wordmark.
- `NEXT_PUBLIC_SITE_URL` continua sendo configuração de deploy (metadataBase, robots, sitemap).
- Salvar configurações chama `revalidatePublicSettings()`, que purga home, `/projetos`, `/projetos/[slug]` e o sitemap, porque navbar/rodapé/metadata aparecem em todas.

## Testes

- `tests/settings.test.mjs` (em `npm test`): validação (obrigatórios, e-mail, WhatsApp com DDD, URLs, opcionais → `NULL`), upsert, foto (upload/rollback/remoção, caminhos), actions, o modo degradado do `getSiteSettings` e a checagem de que as constants não carregam mais conteúdo do banco.
- `tests/e2e/admin-settings.e2e.mjs`: 28 verificações reais — validação sem gravar, salvar contatos refletindo em home/rodapé/WhatsApp/JSON-LD/páginas internas, upload com recusa de SVG disfarçado, foto aparecendo na seção Sobre, remoção limpando Storage, bloqueio de não-admin/anônimo e **restauração dos valores originais** no fim.
