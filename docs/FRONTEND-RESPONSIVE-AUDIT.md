# Auditoria de frontend e responsividade — site público

Revisão de layout, espaçamento e comportamento em breakpoints do site público
(`/`, `/projetos`, `/projetos/[slug]`). Sem redesign: a identidade visual
(fundo escuro, azul da marca, tipografia Geist, cards, estrutura das seções)
foi preservada. O painel `/admin` não foi alterado, e o que ele compartilha com
o site foi verificado ao final.

Todas as medidas abaixo foram tiradas do navegador (Chrome headless, via CDP)
sobre o build de produção, não estimadas.

---

## Problemas encontrados

### P0 — quebra funcional ou de layout

| # | Problema | Onde |
|---|---|---|
| 1 | Lista do `<select>` abria em cinza-claro, quebrando o tema escuro | `Contact.tsx` |
| 2 | Margem lateral do mobile **menor** que a do desktop (10px contra 16px) | `globals.css` |
| 3 | Grade de projetos pulava de 1 para 3 colunas em 768px | `ProjectGrid.tsx` |
| 4 | Âncoras do rodapé mortas em `/projetos` e `/projetos/[slug]` | `Footer.tsx` |

### P1 — problema visual relevante

| # | Problema | Onde |
|---|---|---|
| 5 | Foto do Hero maior que o bloco de texto no telefone (355x394 em 375px) | `Hero.tsx` |
| 6 | Título do Hero em 36px de 320px a 639px, quebrando em 4 linhas | `Hero.tsx` |
| 7 | Botões do Hero com larguras diferentes ao quebrar linha | `Hero.tsx` |
| 8 | Capa do projeto esticada para retrato (473x586) em 1024px | `ProjectCard.tsx` |
| 9 | Painel do CTA com ~380px vazios à direita no desktop | `PrimaryCTA.tsx` |
| 10 | Campo de e-mail 12px mais alto que os vizinhos, com rótulo deslocado | `Contact.tsx` |
| 11 | `<select>` 1px mais baixo que os `<input>` | `Contact.tsx` |
| 12 | Botões preenchidos 2px mais baixos que os contornados | 6 arquivos |
| 13 | Mensagem de status deslocava o fim do formulário ao aparecer | `Contact.tsx` |
| 14 | Botão do WhatsApp sem área segura; sobrepunha a linha de copyright | `WhatsAppButton.tsx`, `Footer.tsx` |
| 15 | Menu mobile sem ESC, sem trava de rolagem e sem limite de altura | `Navbar.tsx` |
| 16 | CTA fora do ritmo vertical (`py-12` contra 96px das demais seções) | `PrimaryCTA.tsx` |

### P2 — refinamento

| # | Problema | Onde |
|---|---|---|
| 17 | `text-slate-500` reprovava no contraste AA (4,08:1 contra 4,5:1 exigidos) | `Footer.tsx`, `Services.tsx`, `About.tsx`, `Contact.tsx` |
| 18 | Tecnologias distribuídas em 3/3/1, com ~250px de vazio na terceira coluna | `Technologies.tsx` |
| 19 | Faixa de autoridade sem separação entre os blocos no telefone | `Authority.tsx` |
| 20 | Duas proporções diferentes para a mesma capa de 1200x630 | `ProjectCard.tsx` |
| 21 | Seta do fluxo de automação podia terminar a linha apontando para o nada | `Automation.tsx` |
| 22 | Área de toque do menu com 40px (mínimo recomendado: 44px) | `Navbar.tsx` |
| 23 | Opacidades de borda quase iguais (`white/6` e `white/8`) | `Services.tsx` |

---

## Causas

**A margem invertida (2)** vinha de um `@media (max-width: 768px)` que
sobrescrevia `.container-shell` com `100% - 1.25rem`, metade do valor do
desktop. A regra existia para ganhar espaço na tela pequena e fazia o contrário
do pretendido: o conteúdo quase encostava na borda entre 320px e 430px.

**O dropdown claro (1)** não era um defeito de CSS do elemento: a lista aberta
do `<select>` é desenhada pelo navegador, não pela folha de estilo da página.
`bg-[#0a101d]` no `<select>` vestia apenas o controle fechado. O que faltava era
declarar ao navegador que a página é escura, com `color-scheme: dark`.

**A capa em retrato (8)** era efeito de `lg:aspect-auto` no card largo: a capa
divide a linha com o texto e estica para acompanhá-lo. Em 1024px a coluna de
texto tinha 586px de altura para 473px de largura, então uma imagem de 1200x630
era recortada em retrato, perdendo mais da metade da largura.

**O campo de e-mail alto (10)** era `align-content: stretch`, o padrão de uma
grade. "WhatsApp" tem texto de apoio e é 24px mais alto que "E-mail"; a linha
assume a altura do maior e estica o menor, e a sobra de 24px era repartida entre
as linhas internas do bloco — 12px para o rótulo, 12px para o campo.

**As alturas de botão (12)** vinham do modelo de caixa: os botões contornados
têm 1px de borda em cima e embaixo, os preenchidos não tinham nenhuma. Lado a
lado em `flex` o problema não aparecia (o `stretch` igualava), mas empilhados em
grade no mobile cada um assumia a altura natural.

**O `<select>` mais baixo (11)** resiste a `line-height`: o Chrome dá precedência
à própria folha de estilo em select nativo, para não quebrar a lista aberta.

---

## Correções

### Camada compartilhada (`globals.css`)

O site já tinha um sistema (`.container-shell`, `.section-space`,
`.section-title`, `.section-copy`, `.card`, escala de raios documentada). As
correções foram feitas nele primeiro, para não virarem remendo em 14 componentes.

- `color-scheme: dark` no `:root`. Resolve a lista do `<select>`, as barras de
  rolagem, o seletor de data e o preenchimento automático do Chrome — no site e
  no painel — mantendo o `<select>` nativo, com teclado, ARIA e leitor de tela.
- `--gutter: clamp(1.25rem, 3vw, 2rem)` e `.container-shell` derivando dele.
  A margem passa a crescer com a viewport (20px → 43px) em vez de encolher.
- `.section-space` agora é `clamp(4.5rem, 8vw, 6rem)`: mesma faixa de antes, sem
  o degrau em 768px.
- `.section-space-tight`, metade exata da medida acima, para o painel do CTA e o
  rodapé, que usavam `py-12` e `py-10` soltos.
- `.hero-title`, com `clamp(1.75rem, 6.2vw, 3rem)`. O teto de 48px é o mesmo de
  antes e continua sendo o maior tamanho que fecha o título em duas linhas na
  coluna do split.
- Regra para `option`, cobrindo o Firefox no Windows, onde `color-scheme` sozinho
  ainda deixava as opções com o fundo do sistema.
- O `@media (max-width: 768px)` foi removido inteiro: as duas regras que ele
  ajustava passaram a interpolar.

### Componentes

- **Hero**: `.hero-title` no lugar do par de degraus; foto limitada a 17rem no
  telefone (270x300 em vez de 355x394) e `sizes` acompanhando; botões em grade de
  uma coluna no mobile, com a mesma largura, e em `flex` a partir de `sm`.
- **ProjectGrid**: o plano de spans virou duas faixas — duas colunas em `md`,
  uma/duas/três em `lg`. Quando a quantidade de cards estreitos é ímpar, o último
  ocupa a linha inteira, para que nenhuma linha termine com metade vazia. A
  aritmética está fixada em `tests/project-grid.test.mjs`, de 1 a 12 projetos.
- **ProjectCard**: proporção única de 1200/630 (a da própria capa, sem recorte);
  divisão em duas colunas movida de `lg` para `xl`; recuo de `p-6` para `p-5` no
  telefone.
- **PrimaryCTA**: painel em duas colunas a partir de `lg`, com os botões na
  direita ocupando o espaço que estava vazio; título na escala `.section-title`.
- **Contact**: `content-start` nos blocos de campo (alinha os seis controles);
  `min-h` e `leading-6` no campo (54px para todos, inclusive o `<select>`);
  `bg-[#0a101d]` removido do `<select>`; altura reservada para a mensagem de
  status, com `mt-1` para afastá-la do botão.
- **Navbar**: ESC fecha o menu, rolagem do corpo travada enquanto aberto,
  altura máxima de `100dvh - 5rem` com rolagem própria, área de toque de 44px.
- **Footer**: `internal` como na Navbar, corrigindo as âncoras nas páginas de
  projeto; terceira coluna dimensionada pelo conteúdo; `pr-16` no copyright para
  a linha não correr por baixo do botão flutuante.
- **WhatsAppButton**: `env(safe-area-inset-bottom/right)`, 52px no telefone e
  56px a partir de `sm`.
- **Technologies**: grade com `items-start` no lugar de `columns-3`.
- **Authority**: divisão horizontal no telefone, vertical a partir de `md`.
- **Automation**: a seta passou a preceder o passo, nunca encerrando uma linha.
- Botões preenchidos do site público receberam `border border-transparent`.

---

## Breakpoints validados

Medidos no build de produção, em `/`, `/projetos` e `/projetos/tag-view`:

```
320x568   360x640   375x667   390x844   412x915   430x932
768x1024  820x1180  1024x768
1280x720  1366x768  1440x900
1536x864  1600x900  1920x1080
```

45 combinações (15 viewports x 3 páginas): **nenhum estouro horizontal** e
`<h1>` presente em todas.

Números por faixa (home):

| viewport | margem | título do Hero | linhas | foto | capa do projeto | recuo de seção |
|---|---|---|---|---|---|---|
| 320px | 20px | 28px | 4 | 270x300 | 278x146 | 72px |
| 390px | 20px | 28px | 3 | 270x300 | 348x183 | 72px |
| 768px | 23px | 47,6px | 2 | 382x425 | 705x370 | 72px |
| 1024px | 31px | 48px | 3 | 335x373 | 946x496 | 82px |
| 1440px | 123px | 48px | 2 | 423x470 | 589x444 | 96px |

Formulário: 1 coluna até 639px, 2 colunas a partir de `sm`; os seis controles
medem 54px em todas as faixas; a mensagem de status ocupa 24px em todos os
estados, então trocar `idle → loading → success` não desloca o layout.

---

## Componentes alterados

`globals.css`, `Hero`, `Navbar`, `Footer`, `WhatsAppButton`, `PrimaryCTA`,
`Contact`, `ProjectGrid`, `ProjectCard`, `Authority`, `Automation`,
`Technologies`, `Services`, `About`, `projetos/page.tsx`,
`projetos/[slug]/page.tsx`.

## Arquivos de teste

`tests/project-grid.test.mjs` (novo): garante que cada linha da grade de
projetos fecha em 6 colunas nas duas faixas, de 1 a 12 projetos, e que só o card
de linha inteira no desktop recebe o formato largo.

---

## Verificação

| Item | Resultado |
|---|---|
| `tsc --noEmit` | limpo |
| `eslint .` | limpo |
| `node --test tests/*.test.mjs` | 141/141 |
| `next build` | sucesso |
| `tests/browser/contact-form.browser.mjs` | 12/12 |
| Menu mobile (abrir, ESC, trava de rolagem, links) | ok |
| Envio real para `/api/contact` | HTTP 200 |
| Âncoras do rodapé em `/projetos` | `/#servicos` |
| Rolagem por âncora sob a navbar fixa | seção em 80px, navbar 81px |
| `/admin/login` em 390px e 1440px | sem estouro, tema escuro intacto |

Os testes em `tests/e2e/` exigem `E2E_PASSWORD` (credencial de administrador) e
não foram executados; eles cobrem a escrita no painel, que esta revisão não
tocou.

---

## Problemas ainda existentes

1. **Título do Hero com 4 linhas em 320px.** De 360px para cima são 3. Reduzir
   mais o piso do `clamp()` deixaria o título pequeno demais para o papel que ele
   tem. 320px é o extremo da faixa e o texto continua legível.

2. **Título do Hero com 3 linhas entre 1024px e 1279px.** O `clamp()` responde à
   viewport, e o que decide a quebra é a largura da coluna do split. Em 1280px e
   acima são 2 linhas, como planejado.

3. **O botão do WhatsApp passa por cima do card de projeto ao rolar** no
   telefone. É próprio de um botão flutuante: em qualquer rolagem ele está sobre
   alguma coisa. Foi verificado que ele **não** cobre o conteúdo do Hero, os
   botões do Hero nem o formulário de contato, que eram os casos de risco. Se
   incomodar, a saída é escondê-lo enquanto o Hero está visível — muda o
   comportamento, então ficou de fora desta revisão.

4. **Travessão no título de um projeto** ("TAG VIEW — Pipeline de Dados..."). É
   conteúdo cadastrado no painel, não código; a troca por hífen é uma edição em
   `/admin/projetos`.

5. **Opacidades de borda ainda variadas** (`white/5`, `/8`, `/10`, `/12`, `/15`,
   `/40` e quatro tons de `blue-400`). As redundantes nos arquivos tocados foram
   unificadas. Uniformizar o resto exigiria passar por todos os componentes para
   ganhar pouco, e `white/40` nos campos de formulário é proposital — borda de
   controle precisa de 3:1, borda decorativa não.
