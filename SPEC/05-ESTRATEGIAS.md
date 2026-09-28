# 05 — Estratégias e decisões

Cada decisão aqui tem um "porquê". Quem continuar o projeto deve manter ou substituir consciente.

## 1. Evolução incremental, nunca reescrita

O site original é a base oficial. A cada fase, uma área sai das constantes e passa para o banco, preservando marcação e identidade. Nenhuma seção foi redesenhada.

**Como se garante:** screenshots antes/depois em desktop e mobile em cada fase que mexe no público, e o card de projeto foi extraído para um componente compartilhado mantendo a marcação original.

## 2. Uma fonte de verdade, e degradação em vez de cópia velha

Durante as fases 9 a 12 as seções caíam para `src/constants/` se a consulta falhasse. Isso fazia sentido enquanto o dado embutido era **idêntico** ao migrado. A partir do momento em que o painel passa a ser usado, deixa de fazer: a cópia embutida no build vira informação errada sobre serviços, projetos e contato.

Na Fase 14 o fallback foi removido. Em falha de consulta, cada seção mostra seu **estado neutro** já existente ("Serviços serão publicados em breve.") e registra o erro no log.

**Por que isso não deixa o site frágil:** com ISR, uma revalidação que falha mantém a última renderização boa em cache. O estado vazio só apareceria numa renderização fria com o banco fora — cenário em que mostrar dado desatualizado seria pior do que mostrar nada.

As configurações institucionais têm um caso à parte: os campos obrigatórios não podem simplesmente sumir, então `getSiteSettings()` devolve um objeto **degradado** com apenas a marca preenchida. Na prática é inalcançável — a linha é singleton, foi criada pelo seed e nenhum papel consegue apagá-la (casos 60 e 63 da matriz de RLS).

**O que continua no código de propósito:** o texto editorial da página (Hero, Problemas, Soluções, Autoridade, Como funciona, Diferenciais, Automação), a estrutura de navegação e a URL do site. Nada disso é conteúdo que o cliente edite.

## 3. Cache: ISR + revalidação sob demanda

Escolha: `export const revalidate = 3600` por segmento **mais** `revalidatePath` disparado por toda escrita do painel.

**Por que não `"use cache"`/`cacheComponents`:** é recurso novo do Next 16 que precisa ser ligado no app inteiro e muda a semântica de renderização de todas as rotas. Risco alto para ganho baixo numa fase incremental.

**Por que não `unstable_cache` com tags:** no Next 16 o `revalidateTag` mudou de assinatura e misturar com o sistema legado de tags é comportamento incerto. `revalidatePath` é determinístico e purga a rota **e** os dados daquela renderização.

`src/lib/revalidate.ts` centraliza o mapeamento área → rotas:

| Escrita | Invalida |
|---|---|
| Projetos | `/`, `/projetos`, `/projetos/[slug]`, `/sitemap.xml` |
| Serviços | `/` |
| Tecnologias | tudo de projetos (os badges aparecem nos cards) |
| Configurações | tudo de projetos (navbar, rodapé e metadata aparecem em todas) |

O ISR de 1h é a rede de segurança para alterações feitas fora do app (SQL direto).

## 4. Transação onde há relacionamento; tabela direta onde não há

| Entidade | Como grava | Motivo |
|---|---|---|
| Projetos | RPC `admin_save_project` | Projeto + tecnologias ordenadas precisam ser atômicos |
| Grupos de tecnologia | RPC `admin_save_technology_group` | Idem para os membros |
| Exclusão de tecnologia | RPC `admin_delete_technology` | Limpar vínculos de grupo e excluir precisa ser atômico, e o bloqueio por projeto tem que ser confiável |
| Serviços, tecnologias, configurações | Tabela direta | Não há relacionamento; uma instrução basta e o RLS já cobre |

As RPCs são `SECURITY INVOKER` para **não** contornar o RLS. Poder e simplicidade: a função organiza a transação, o banco continua decidindo permissão.

## 5. Ordem explícita, nunca implícita

Tudo que o usuário ordena tem `display_order`. Nas relações N:N, **a ordem do array enviado pelo formulário vira o `display_order`** — o admin arrasta (↑ ↓) e a ordem aparece igual no site. Nenhuma ordenação depende de data de criação ou de alfabeto, exceto como desempate.

## 6. Uploads: confiar no conteúdo, não no nome

O tipo da imagem é detectado pelos **magic bytes** no servidor. Nome de arquivo e `Content-Type` enviados pelo cliente são ignorados, então um SVG com script renomeado para `.png` é recusado.

Por que upload **pela Server Action** e não direto do navegador para o Storage: é o que permite validar o conteúdo antes de gravar. O custo é o limite de corpo (`bodySizeLimit: 6mb`, para 5 MB de imagem mais o overhead do multipart).

**Ordem de gravação que evita inconsistência:**

1. sobe um objeto **novo e imutável** (nome com UUID);
2. aponta o registro para ele;
3. só então remove o anterior.

Se o passo 2 falha, o objeto novo é apagado — não sobra órfão e a imagem antiga continua válida. Excluir um projeto limpa a pasta dele.

## 7. Validação espelhando o banco

Cada entidade tem um schema Zod com os **mesmos limites das constraints** do Postgres. A validação existe para dar mensagem boa em português, não para ser a única defesa — o banco recusa de qualquer forma.

Erros do banco são classificados: o acionável vira erro no campo (slug duplicado, tecnologia em uso), o resto vira mensagem genérica com detalhe só no log.

**Detalhe descoberto na prática:** formulários enviam quebras de linha de `<textarea>` como CRLF. Os parsers normalizam para `\n` antes de gravar, senão o texto salvo acumula `\r`.

## 8. Formulários controlados no painel

O React 19 limpa campos não controlados após uma Server Action. Com campos controlados, um erro de validação não faz o usuário perder o que digitou.

## 9. Ícones por allowlist

O banco guarda o **nome** do ícone Lucide; o site resolve por um mapa fechado de 31 nomes. Um nome desconhecido cai no ícone padrão em vez de quebrar a página.

A verificação usa `Object.hasOwn`, não `in` — com `in`, nomes de protótipo como `toString` passariam pela validação. Isso foi pego por teste.

## 10. Testes em quatro níveis

| Nível | O que cobre | Custo |
|---|---|---|
| **Unitário** (`npm test`, 136) | Lógica pura e de borda: slugs, validação, mapeamento de erros, ordem, degradação das seções, actions. Sem rede, sem banco | segundos |
| **Matriz de RLS** (89 casos) | Permissões reais no Cloud, por papel, em transação desfeita | ~1s |
| **E2E** (8 suítes, 230 verificações) | Fluxos completos por HTTP contra o Cloud real, incluindo uploads de imagem de verdade | minutos |
| **Navegador** (`npm run test:browser`, 12) | O que só existe depois da hidratação: o handler do formulário público, com o `fetch` da página substituído | ~15s |

O nível de navegador nasceu na Fase 17 porque o defeito mais visível do projeto — o formulário mostrando erro depois de um envio aceito — **não era detectável por HTTP**: só aparece quando o React executa o handler. Usa CDP sobre o WebSocket nativo do Node, sem dependência nova e sem container.

Os helpers (`tests/helpers/`) carregam o TypeScript real num contexto isolado e substituem **apenas** framework/SDK, então o teste exercita o código de produção, não uma cópia.

Os E2E criam e removem seus próprios dados, e a suíte de configurações **restaura** os valores originais. A exceção é a de contatos: um lead não é apagável pela aplicação, por decisão de projeto, então a limpeza é feita pelo conector. Cada fase termina verificando que o banco voltou ao estado esperado.

## 11. Git e migrations espelhadas

O projeto não tinha Git; foi criado um commit de base antes de qualquer mudança, e cada fase é um commit descritivo. As migrations locais têm exatamente as versões aplicadas no Cloud, então o histórico do repositório conta a mesma história do banco.

## 12. Contato: gravar primeiro, notificar depois

O lead é escrito no banco **antes** de qualquer tentativa de e-mail, e o e-mail é tratado como notificação.

| Situação | Resposta ao visitante | Consequência |
|---|---|---|
| Gravou e notificou | 200 | nada a fazer |
| Gravou, e-mail falhou ou não configurado | 200 | o lead está em `/admin/contatos`; a falha fica no log |
| Não gravou, e-mail saiu | 200 | o lead está na caixa de entrada |
| Nenhum dos dois | **503** | é o único caso em que pedir outro canal é honesto |

**Por quê:** um formulário de captação que responde "enviado" sem ter guardado nada em lugar algum é a pior falha possível neste site. E o inverso também: uma indisponibilidade do Resend não deve devolver erro a quem já está registrado.

O honeypot é a exceção deliberada: responde como sucesso e **não grava nada**, para não dar retorno útil a um bot.

## 13. A chave privilegiada existe para um caso só

A `service_role` é usada exclusivamente para gravar o lead do formulário público — o único momento em que alguém não autenticado legitimamente escreve no banco. Tudo no painel continua usando a sessão do admin, com o RLS valendo.

O que mantém isso estreito não é a confiança no código, são os **grants por coluna**: a `service_role` pode inserir apenas `name, company, email, whatsapp, project_type, message, source`, e ler de volta apenas `id`. Não define `status`, não lê e-mail de ninguém, não toca em nenhuma outra tabela. Os quatro casos da matriz de RLS (80–84, 99–100) provam isso no banco real.

**Alternativa recusada:** liberar `insert` para `anon` (ou uma RPC `SECURITY DEFINER` aberta) dispensaria a chave, mas permitiria gravar contatos direto na API, sem passar pelo rate limit do endpoint. Manter a escrita no servidor é o que torna o limite efetivo.

## 14. Segredos

Nenhum valor real aparece em documento, log ou commit. `.env*` é ignorado (exceto o exemplo). A chave privilegiada nunca recebe prefixo `NEXT_PUBLIC_`. Erros de configuração citam o **nome** da variável, nunca o valor.
