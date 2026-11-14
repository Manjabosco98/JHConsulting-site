# Painel empresarial

O painel acompanha o site institucional: prioriza contatos, serviços e informações da empresa, mantendo a identidade visual escura com azul.

## Organização

- Navegação principal: Visão geral, Contatos, Serviços e Configurações.
- Projetos não aparece no menu, nos indicadores, nas ações rápidas ou nas atualizações recentes. A visão geral não consulta essa tabela.
- `/admin/projetos` e seus subcaminhos retornam HTTP 307 para `/admin`. O destino mantém a exigência de administrador.
- Tecnologias permanece acessível em Configurações técnicas, recolhido por padrão.
- A visão geral apresenta novos contatos, negociações, convertidos e serviços ativos. A fila mostra até cinco contatos recentes em aberto, excluindo convertidos e arquivados.
- As contagens de contatos usam consultas exatas, sem depender do limite de linhas retornadas pelo Supabase.
- Configurações prioriza empresa, apresentação e atendimento. Informações pessoais anteriores, redes e imagem ficam recolhidas; os campos continuam preservados e submetidos.
- Serviços destaca descrição, ordem e visibilidade pública. A anotação técnica opcional fica recolhida e identificada como interna.

## Dados e proteção

Nenhum registro de projeto foi apagado. Não houve migração, alteração de políticas, credenciais, autenticação, envio de e-mail ou escrita no banco nesta atualização. As ações de serviços e configurações continuam usando a validação e a autorização existentes.

A implementação legada de projetos permanece versionada para recuperação e manutenção histórica. O redirecionamento remove o acesso às suas telas pela navegação normal; não substitui as verificações de autorização das ações do servidor.

## Validação desta alteração

- 148 testes unitários aprovados, incluindo consultas sem projetos, contagens acima de mil contatos, filtros, estados vazios, renderização e preservação dos campos recolhidos.
- Build de produção e `npm run typecheck` aprovados.
- 16 verificações HTTP públicas e quatro verificações HTTP do administrador aprovadas no build de produção: redirecionamentos das rotas antigas e proteção da visão geral sem sessão.
- Sintaxe do roteiro autenticado atualizada e conferida. Esse roteiro não foi executado nesta alteração: exige credenciais e usuário de teste autorizado.
- Revisão visual em navegador de uma prévia estática dos componentes reais da visão geral e dos formulários de configurações e serviço. Essa prévia usa dados ilustrativos, sem sessão ou gravação no Supabase; não equivale a teste funcional autenticado em produção nem a teste em dispositivo móvel.
- `git diff --check` aprovado.

Entrega em pull request. A publicação no Render depende do merge pelo responsável e do deploy subsequente.
