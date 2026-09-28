# Projetos públicos (Fase 9)

As páginas públicas que mostram projetos leem do Supabase Cloud pela conta anônima; o RLS já limita a projetos publicados e não arquivados e às tecnologias visíveis.

## Rotas

| Rota | Render | Conteúdo |
|---|---|---|
| `/` (seção Projetos) | ISR 1h | projetos publicados na ordem de exibição + link "Ver todos" |
| `/` (seção Serviços) | ISR 1h | serviços ativos na ordem de exibição, ícone resolvido pela allowlist |
| `/` (seção Tecnologias) | ISR 1h | grupos ativos com suas tecnologias ativas, na ordem definida |

Desde a Fase 14 nenhuma dessas seções tem dado embutido: em erro de consulta, o erro vai para o log e a seção mostra seu estado neutro ("… em breve"). O ISR mantém a última renderização boa em cache, então o estado vazio só apareceria numa renderização fria com o banco indisponível.

## SEO (Fase 15)

- **Dados estruturados**: a home publica `ProfessionalService`; cada projeto publica `CreativeWork` + `BreadcrumbList`. Tudo passa por `src/components/seo/JsonLd.tsx`, que escapa `<` — sem isso, um texto editado no painel contendo `</script>` sairia da tag.
- **Imagem social**: `src/app/opengraph-image.tsx` gera um PNG 1200×630 com `next/og` a partir de `site_settings` (ISR de 1h). Um projeto com capa usa a própria capa.
- **Atenção ao declarar `openGraph` numa página**: o objeto substitui o do pai por inteiro, **inclusive as imagens da convenção de arquivo**. Toda página com metadata própria precisa apontar `images` explicitamente — use `DEFAULT_OG_IMAGE` (`src/lib/seo/og.ts`). Coberto por E2E.
- **Sitemap**: `lastModified` vem da alteração real de conteúdo (`updated_at` dos projetos e das configurações), não do instante da renderização.
| `/projetos` | ISR 1h | listagem completa (mesmo card da home) |
| `/projetos/[slug]` | SSG + on-demand | capa, problema, solução, descrição, tecnologias ordenadas, links e CTA; `notFound()` para rascunho/arquivado/inexistente |
| `/sitemap.xml` | ISR 1h | home, `/projetos` e cada projeto publicado |

## Camada de dados

- `src/lib/supabase/public.ts`: cliente anônimo **sem cookies** (`createPublicClient`), para as páginas continuarem cacheáveis.
- `src/lib/repositories/public-projects.ts`: `listPublishedProjects`, `getPublishedProjectBySlug`, `listPublishedProjectSlugs` (esta nunca lança, para não quebrar build/sitemap). Caminho de capa → URL via `publicImageUrl`.

## Cache e revalidação

- Cada segmento define `export const revalidate = 3600` (piso de atualização).
- Toda escrita de projeto no admin chama `revalidatePublicProjects()` (`src/lib/revalidate.ts`), que faz `revalidatePath` de `/`, `/projetos`, `/projetos/[slug]` (page) e `/sitemap.xml`. Assim, publicar/despublicar/editar/excluir aparece no site **sem novo deploy** (comprovado no E2E).
- `next/image` só aceita imagens do bucket `portfolio` (ver Fase 8). `NEXT_PUBLIC_SUPABASE_URL` precisa existir **no build**.

## Navegação

`Navbar` recebe `internal` nas páginas fora da home: as âncoras viram `/#inicio`, `/#servicos`… e a marca aponta para `/`.

## Testes

- `tests/e2e/public-projects.e2e.mjs` (19 verificações contra o Cloud): publicado aparece na home/listagem/detalhe/sitemap; rascunho e inexistente dão 404; metadata canônica e OG; âncoras internas; e a revalidação on-demand ao despublicar e excluir. Sem resíduos.
