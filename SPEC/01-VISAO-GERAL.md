# 01 — Visão geral

## O que é

Site institucional e portfólio profissional da **JHConsulting** (João Henrique Manjabosco), focado em automação de processos, desenvolvimento de sistemas, APIs, integrações, dados e IA aplicada a empresas.

É um site de uma página (landing) com seções âncora, mais páginas dedicadas de portfólio, e um painel administrativo protegido.

## Objetivo do trabalho

Transformar um site estático — cujo conteúdo vivia em arquivos TypeScript — em uma **aplicação administrável**, sem recriar o site.

O critério de sucesso é simples: **cadastrar ou alterar conteúdo normal do portfólio não deve exigir mexer em código nem fazer deploy.**

## Fluxo de ponta a ponta

```text
┌──────────────┐        ┌─────────────────┐        ┌──────────────────┐
│   /admin     │  ───▶  │ Supabase Cloud  │  ───▶  │  site público    │
│ (você edita) │        │ Postgres+Storage│        │ (atualiza na hora)│
└──────────────┘        └─────────────────┘        └──────────────────┘
        │                                                   ▲
        └────────── revalidatePath (ISR on-demand) ─────────┘
```

1. Você entra em `/admin/login` com e-mail e senha.
2. O servidor confirma que o usuário é administrador ativo consultando o banco.
3. Você edita projetos, serviços, tecnologias, configurações ou imagens.
4. A gravação passa por validação, pelas permissões do banco (RLS) e, quando envolve relacionamentos, por uma função transacional.
5. Ao salvar, o Next.js invalida o cache das páginas públicas afetadas.
6. A próxima visita ao site já mostra o conteúdo novo — **sem deploy**.

## Quem usa

| Perfil | O que pode fazer |
|---|---|
| **Visitante** (anônimo) | Ver o site: projetos publicados, serviços e tecnologias ativos, informações institucionais. Enviar o formulário de contato |
| **Administrador** | Tudo do painel: criar, editar, publicar, arquivar, ordenar, enviar imagens e ler contatos |
| **Usuário logado sem permissão** | Exatamente o mesmo que um visitante. Ter conta não dá acesso a nada |

## O que é administrável hoje

| Conteúdo | Onde se edita | Onde aparece |
|---|---|---|
| Projetos (com capa, tecnologias, publicação, ordem) | `/admin/projetos` | Home, `/projetos`, `/projetos/[slug]`, sitemap |
| Serviços (com ícone e ordem) | `/admin/servicos` | Seção Serviços da home |
| Tecnologias e seus grupos | `/admin/tecnologias` | Seção Tecnologias e badges dos projetos |
| Empresa, profissional, cargo, bio, foto, contato e redes | `/admin/configuracoes` | Metadata, Hero, Sobre, Rodapé, links de WhatsApp, JSON-LD |

Os **contatos recebidos** pelo formulário não são conteúdo que você escreve, mas são acompanhados em `/admin/contatos`: a mensagem é registro histórico e imutável; o que muda é o status do atendimento.

## O que continua no código (por decisão)

Conteúdo **editorial** que não muda com frequência e faz parte da narrativa da página: textos do Hero, seções Problemas, Soluções, Autoridade, Como funciona, Diferenciais e Automação, além dos rótulos e chamadas das seções. Vive em `src/constants/content.ts`.

Também permanecem em código, de propósito:

- o **wordmark** "JH**Consulting**" (é logo, não dado);
- a **navegação** (estrutura da página);
- a **URL do site** e chaves (configuração de deploy, em variáveis de ambiente).

Desde a Fase 14 não há mais conteúdo duplicado: o que o banco administra saiu das constantes, e as seções degradam para um estado neutro se a consulta falhar.

## Identidade visual a preservar

Fundo escuro `#080d18`, superfícies `#0d1424`, azul `#3b82f6`, ciano `#22d3ee`, gradientes, cards arredondados, tipografia Arial/Helvetica, container de 1180px e navbar fixa. Toda evolução respeita esse sistema; o painel usa a mesma linguagem visual.
