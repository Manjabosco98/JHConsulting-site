import assert from "node:assert/strict";
import test from "node:test";
import { loadTs, plain } from "./helpers/load-ts.mjs";

/**
 * A grade do portfólio não tem largura fixa: ela escolhe o span de cada card a
 * partir da quantidade publicada, para que nenhuma linha termine com célula
 * vazia. São duas faixas (`md` com duas colunas, `lg` com três) sobre a mesma
 * base de 6 colunas, e a conta é fácil de quebrar ao mexer nela.
 *
 * O que estes testes fixam é a propriedade que importa, não os números: a soma
 * dos spans de cada linha tem de fechar exatamente em 6 nas duas faixas.
 */
const { spanPlan } = loadTs("src/components/projects/ProjectGrid.tsx", {
  mocks: {
    // Só interessa a aritmética do plano; o card arrasta next/link e next/image.
    "@/components/projects/ProjectCard": { ProjectCard: () => null },
    // Primeiro teste a carregar um .tsx: o TypeScript compila o JSX para chamadas
    // de `react/jsx-runtime`, e nada aqui renderiza, então um esboço basta.
    "react/jsx-runtime": { jsx: () => null, jsxs: () => null, Fragment: Symbol("Fragment") }
  }
});

/** `"3-2"` → `[3, 2]`: o plano devolve a chave `md-lg`, não o par de números. */
const spansOf = (key) => key.split("-").map(Number);

/** Quebra a sequência de spans em linhas de 6 e devolve a soma de cada uma. */
function rowSums(spans) {
  const rows = [];
  let current = 0;
  for (const span of spans) {
    // Span que não cabe no resto da linha começa a linha seguinte, que é o que
    // o CSS Grid faz com `grid-column: span N`.
    if (current + span > 6) {
      rows.push(current);
      current = 0;
    }
    current += span;
  }
  if (current) rows.push(current);
  return rows;
}

test("grade de projetos: nenhuma linha fica incompleta, de 1 a 12 projetos", () => {
  for (let count = 1; count <= 12; count += 1) {
    const plan = plain(spanPlan(count));
    assert.equal(plan.length, count, `${count} projetos deveriam render ${count} células`);

    for (const [faixa, index] of [["md", 0], ["lg", 1]]) {
      const sums = rowSums(plan.map((key) => spansOf(key)[index]));
      assert.deepEqual(
        sums.filter((sum) => sum !== 6),
        [],
        `${count} projetos deixam linha incompleta em ${faixa}: ${sums.join(", ")}`
      );
    }
  }
});

test("grade de projetos: o card largo abre a contagem de resto 1", () => {
  // 1, 4 e 7 projetos: o primeiro ocupa a linha inteira nas duas faixas, e é o
  // único caso que recebe o layout `wide` de duas colunas.
  for (const count of [1, 4, 7]) {
    assert.equal(plain(spanPlan(count))[0], "6-6", `${count} projetos`);
  }
  // Resto 2 abre com um par de meia-linha; resto 0 não tem abertura larga.
  assert.deepEqual(plain(spanPlan(2)), ["3-3", "3-3"]);
  assert.equal(spansOf(plain(spanPlan(3))[0])[1], 2);
});

test("grade de projetos: só o card de linha inteira no desktop é `wide`", () => {
  // `6-2` é largo apenas no tablet: ele existe para fechar a linha de duas
  // colunas, e no desktop volta a ser um terço. Confundir os dois daria a um
  // card estreito o layout de capa ao lado do texto.
  const withOddNarrow = plain(spanPlan(3));
  assert.equal(withOddNarrow.at(-1), "6-2");
  assert.equal(withOddNarrow.filter((key) => key === "6-6").length, 0);
});

test("grade de projetos: sem projetos não há células", () => {
  assert.deepEqual(plain(spanPlan(0)), []);
});
