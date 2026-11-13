# Site empresarial da JHConsulting

## Comportamento público

O visitante conhece a empresa, os serviços e as aplicações que podem apoiar sua operação. Não precisa navegar por projetos, biografia pessoal ou listas de ferramentas.

A página apresenta, nesta ordem: abertura, benefícios, empresa, catálogo de serviços, aplicações no negócio, como trabalhamos, diferenciais, perguntas frequentes, chamada comercial e formulário.

O catálogo atual permanece administrável, com os oito serviços cadastrados. O texto e a ordem continuam vindo de `/admin/servicos`. Os chips técnicos foram retirados dos cartões. As aplicações são exemplos de uso dos serviços; não representam cases, estatísticas ou promessas de resultado.

Logo, ícones da marca, fontes, paleta escura e elemento visual da abertura foram preservados.

## Dados e administração

- Serviços: título, descrição e ordem vêm do Supabase, com o acesso público existente.
- Contatos, localização e área de atendimento: vêm das configurações do painel.
- Narrativa empresarial, aplicações, método e FAQ: conteúdo editorial versionado no código.
- Biografia, retrato e perfis pessoais anteriores: preservados nos registros, sem exibição pública ou nos dados estruturados.
- O painel sinaliza somente e-mail e WhatsApp como contatos comerciais pendentes.
- O formulário mantém o contrato `projectType` / `project_type` para compatibilidade, exibido como “Serviço de interesse”.
- Não houve alteração de banco, autenticação, permissões, Storage ou envio de mensagens reais nesta reformulação.

## Portfólio retirado

`/projetos` e qualquer caminho abaixo dele retornam redirecionamento permanente para `/#servicos`. A regra em `next.config.ts` roda antes da renderização: evita que a geração assíncrona de metadados transforme a resposta em streaming com status 200.

Os componentes das rotas também redirecionam como proteção adicional. Não há leitura de projetos nessas rotas. O sitemap lista somente a home. Os registros e ferramentas administrativas anteriores foram preservados; não há obrigação de cadastrar projetos para usar o site empresarial.

## Validação

Verificação em 13/11/2026: build de produção aprovado, TypeScript sem erros, 145 testes unitários e 16 verificações HTTP passando.

- Build de produção e TypeScript.
- Suíte unitária, incluindo ausência de conteúdo pessoal e redirecionamentos.
- Regressão HTTP somente de leitura: home, navegação, catálogo, FAQ, dados estruturados, sitemap, imagem social, proteção do admin e HTTP 308 das rotas antigas.
- Revisão visual em navegador: abertura, serviços, contato, FAQ e menu compacto.
- Largura reduzida conferida com zoom do navegador (338 px úteis), sem transbordamento lateral; não se trata de emulação de dispositivo.
- Os testes que modificam dados reais do painel e enviam e-mails não foram executados nesta tarefa.

A execução dos testes HTTP fica em `tests/e2e/public-projects.e2e.mjs`. O nome foi mantido para que quem executava a regressão anterior passe a conferir a retirada do portfólio.

## Entrega

Alteração preparada em branch e pull request para revisão, sem merge ou deploy em produção.
