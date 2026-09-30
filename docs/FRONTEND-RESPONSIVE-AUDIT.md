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

> Os itens 1 e 3 foram resolvidos na segunda rodada; ver SECOND RESPONSIVE PASS,
> no fim deste documento. O item 3 estava, além disso, incompleto: a verificação
> de que o botão não cobria os botões do Hero foi feita em 390px e 1440px, e a
> colisão existia em 320x568.

1. ~~**Título do Hero com 4 linhas em 320px.**~~ Resolvido: o piso do `clamp()`
   desceu para 1.625rem e são 3 linhas em 320px.

2. **Título do Hero com 3 linhas entre 1024px e 1279px.** O `clamp()` responde à
   viewport, e o que decide a quebra é a largura da coluna do split. Em 1280px e
   acima são 2 linhas, como planejado.

3. ~~**O botão do WhatsApp passa por cima do card de projeto ao rolar.**~~
   Resolvido na parte que importava: ele agora só aparece depois que o Hero sai da
   tela, então não há mais colisão com as ações principais. Passar sobre texto no
   meio da rolagem continua acontecendo, e continua sendo próprio de um botão fixo.

4. **Travessão no título de um projeto** ("TAG VIEW — Pipeline de Dados..."). É
   conteúdo cadastrado no painel, não código; a troca por hífen é uma edição em
   `/admin/projetos`.

5. **Opacidades de borda ainda variadas** (`white/5`, `/8`, `/10`, `/12`, `/15`,
   `/40` e quatro tons de `blue-400`). As redundantes nos arquivos tocados foram
   unificadas. Uniformizar o resto exigiria passar por todos os componentes para
   ganhar pouco, e `white/40` nos campos de formulário é proposital — borda de
   controle precisa de 3:1, borda decorativa não.

---

# SECOND RESPONSIVE PASS

Segunda rodada, só de correção: nenhuma mudança de identidade, de texto ou de
backend. O foco foi o que a primeira passagem deixou para trás, mais o que ela
mediu errado.

A rodada anterior fechou com "nenhum estouro horizontal em 45 combinações", e
isso continuava verdadeiro. O que não estava verdadeiro era uma suposição escrita
em comentário, e ela custava um terço de uma imagem.

## Problemas encontrados

### P0

| # | Problema | Onde |
|---|---|---|
| 1 | Capa do projeto perdendo 33,7% da largura no desktop | `ProjectCard.tsx` |
| 2 | Capa do projeto perdendo 4,8% da largura nos demais formatos | `ProjectCard.tsx`, `projetos/[slug]` |
| 3 | Botão flutuante cobrindo os dois botões do Hero em 320x568 | `WhatsAppButton.tsx` |

### P1

| # | Problema | Onde |
|---|---|---|
| 4 | Fluxo de automação quebrando em linhas arbitrárias no telefone | `Automation.tsx` |
| 5 | Título de seção em 30px fixos em toda a faixa mobile (6 linhas em 320px) | `globals.css` |
| 6 | Título mais longo da página em 5 linhas no desktop | `globals.css` |
| 7 | Âncora parando 1px atrás do cabeçalho, sem respiro | `globals.css` |
| 8 | Pré-visualização de capa no painel com enquadramento diferente do site | `CoverImageForm.tsx` |

### P2

| # | Problema | Onde |
|---|---|---|
| 9 | Ausência de `min-w-0` em itens de flex com texto | `ProjectCard.tsx`, `Problems.tsx` |
| 10 | Altura da navbar escrita à mão em dois lugares que precisam concordar | `globals.css`, `Navbar.tsx` |

Auditorias que passaram sem achado: `white-space: nowrap` (nenhuma ocorrência no
site público), `w-screen` (nenhuma), `100vw` (só dentro de `sizes`, que é dica de
mídia e não largura) e larguras fixas em pixel (nenhuma).

## Causas

**A capa recortada (1 e 2)** vinha de uma afirmação errada no código. O comentário
dizia que as capas são enviadas em 1200x630, e a moldura foi construída sobre
isso. Nada valida dimensão no upload: `src/lib/storage/images.ts` não checa
proporção, e a capa publicada mede 2:1 exatos. Medido no navegador, a moldura de
1200/630 com `object-cover` já cortava 4,8% da largura de toda capa. No card
largo era pior: a célula da imagem herdava a altura da coluna de texto ao lado,
o que punha uma imagem 2:1 numa caixa de 1,327 e comia 33,7% da largura.

Vale registrar a conta, porque ela fecha a discussão sobre manter a capa ao lado
do texto: testando colunas de imagem de 620px a 850px, o resultado é sempre
recorte de 25% a 34% (preenchendo) ou vão de 70px a 130px (contendo), porque o
bloco de texto não desce de ~400px de altura. Não existe divisão que feche.

**O botão sobre os botões do Hero (3)** só aparece em tela baixa. Em 320x568 os
dois botões do Hero caem na faixa inferior da viewport, exatamente onde fica o
botão flutuante. A primeira rodada verificou 390px e 1440px, onde não há colisão,
e concluiu que estava resolvido. Estava, menos na tela mais estreita e mais baixa.

**Os títulos (5 e 6)** tinham um `clamp` de inclinação única. Com piso de
1.875rem e `3.2vw`, o piso valia até 938px: o título media 30px em toda a faixa
mobile, e o mais longo (75 caracteres) ocupava seis linhas em 320px. Trocar só o
piso consertaria o telefone e encolheria o tablet, daí a reta com intercepto.

## Correções

- **Capa**: moldura única `aspect-[2/1]` com `object-contain` e fundo do card, no
  card, na página do case e na pré-visualização do painel. Como a proporção da
  capa não é garantida, preencher significa cortar uma quantidade desconhecida de
  cada imagem nova; contendo, o desvio vira faixa da própria superfície em vez de
  conteúdo perdido. A capa do card largo saiu de ao lado do texto e foi para cima,
  na largura inteira.
- **Botão flutuante**: passou a aparecer só depois que o Hero sai da tela, via
  `IntersectionObserver` num componente de cliente novo (`FloatingWhatsApp`).
  Enquanto oculto é `opacity: 0`, `pointer-events: none`, `aria-hidden` e
  `tabIndex -1`, então não bloqueia mouse, teclado nem leitor de tela. O estado
  inicial é visível, que é o que o servidor entrega, então sem JavaScript o botão
  continua lá. Nas páginas internas não existe `#inicio` e ele aparece desde o
  início.
- **Fluxo de automação**: coluna no telefone e linha a partir de `sm`, com a mesma
  seta girada 90 graus. Nenhuma marcação duplicada para o mobile.
- **Escala dos títulos**: `clamp` com intercepto (`1.05rem + 2.3vw`) e teto em
  2.5rem. O teto desceu de 46px para 40px porque quem limita a quebra é a coluna,
  não a viewport: quatro títulos ficam em coluna de meia largura. Medido, 40px não
  custa linha nenhuma nos títulos de largura inteira e tira uma do mais longo.
- **Âncora**: `scroll-padding-top` virou `calc(var(--nav-h) + 1.5rem)`, e
  `--nav-h` passou a ser a fonte única da altura do cabeçalho, usada também pela
  altura máxima do menu mobile.
- **`min-w-0`** nos blocos de texto dentro de itens de flex.

## Imagens

| viewport | natural | caixa | ajuste | perda | faixa |
|---|---|---|---|---|---|
| 320x568 | 320x160 | 278x139 | contain | 0,0% | 0x0 |
| 390x844 | 390x195 | 348x174 | contain | 0,0% | 0x0 |
| 768x1024 | 768x384 | 705x352 | contain | 0,0% | 0x0 |
| 1024x768 | 1024x512 | 946x473 | contain | 0,0% | 0x0 |
| 1280x720 | 1180x590 | 1178x589 | contain | 0,0% | 0x0 |
| 1920x1080 | 1180x590 | 1178x589 | contain | 0,0% | 0x0 |

Zero recorte e zero faixa em todas as faixas: a capa mede 2:1 e a moldura é 2/1,
então o encaixe é exato. A faixa só apareceria se alguém publicasse uma capa de
proporção diferente, e aí ela é o comportamento correto.

## Breakpoints validados

Os 13 da rodada anterior mais os três de paisagem que faltavam:

```
320x568  360x640  375x667  390x844  412x915  430x932
768x1024 820x1180 1024x768
1280x720 1366x768 1440x900 1920x1080
667x375  844x390  932x430          <- paisagem
```

16 viewports x 3 páginas = **48 combinações, nenhum estouro horizontal**.

Títulos por faixa (o mais longo da página, 75 caracteres):

| viewport | tamanho | linhas |
|---|---|---|
| 320px | 24,2px | 4 (eram 6) |
| 390px | 25,8px | 4 |
| 768px | 34,5px | 3 |
| 1280px | 40px | 4 (eram 5) |

Fluxo de automação: eixo `column` até 767px e `row` a partir de 768px; seta em
`rotate: 90deg` no telefone e `none` no desktop.

## Componentes alterados

`globals.css`, `ProjectCard`, `Automation`, `Navbar`, `WhatsAppButton`,
`FloatingWhatsApp` (novo), `Problems`, `projetos/[slug]`, `CoverImageForm`.

## Verificação

| Item | Resultado |
|---|---|
| `tsc --noEmit` | limpo |
| `eslint .` | limpo |
| `node --test tests/*.test.mjs` | 141/141 |
| `next build` | sucesso |
| `contact-form.browser.mjs` | 12/12 |
| Menu mobile (abrir, ESC, trava, links) | ok |
| Envio real para `/api/contact` | HTTP 200 |
| Âncora sob a navbar | seção em 104px, cabeçalho 81px |
| Botão flutuante sobre o Hero | `opacity 0`, `pointer-events none`, `aria-hidden` |
| Botão flutuante em /projetos | visível desde o início |

## Problemas ainda existentes

1. **O título mais longo fica em 4 linhas** em 320px e em 1280px. São 75
   caracteres numa coluna de meia largura; chegar a três linhas exigiria cerca de
   31px no desktop, menor que o tamanho do tablet, o que inverteria a hierarquia.
   `text-wrap: balance` mantém as quatro linhas equilibradas.

2. **O card de destaque fica alto**: 965px em 1280px, dos quais 589px são a capa.
   É o custo de mostrar uma imagem 2:1 inteira na largura do card. Reduzir a
   altura só seria possível recortando a imagem, que é o problema que esta rodada
   existiu para resolver.

3. **O botão flutuante ainda passa sobre texto ao rolar**, depois do Hero. É
   próprio de um botão fixo: em alguma posição de rolagem ele está sobre alguma
   coisa. O que foi eliminado é o caso que importa, a colisão com as ações
   principais na posição inicial da página.

4. **Travessão no título de um projeto** ("TAG VIEW ... Pipeline de Dados"),
   ainda conteúdo do painel e não código.

5. **Opacidades de borda variadas** fora dos arquivos tocados, como na rodada
   anterior.
