# Arquitetura

[English (US)](../en-US/architecture.md)

## Implementado

Monólito modular Next.js com App Router, React, TypeScript strict e Tailwind. `src/app` contém rotas, layout e estilos. Alias `@/*` aponta para `src/*`. A página inicial é um Server Component estático, sem dados de clientes ou dependência de serviços externos.

BF-002 adiciona Prisma 7.10.0 com adaptador PostgreSQL, schema inicial de negócio (BF-003) e geração em `src/generated/prisma` (ignorada pelo Git). `src/lib/prisma.ts` usa `server-only` e disponibiliza `getPrisma()` com inicialização sob demanda e reutilização durante hot reload. A fábrica compartilhada configura pool máximo de cinco conexões e timeout de conexão de cinco segundos. A página inicial continua independente do banco.

`prisma.config.ts` carrega o mesmo ambiente do Next.js usando `@next/env`. A URL é opcional para gerar/validar o schema; é obrigatória e validada ao abrir uma conexão. O script `db:check` executa apenas `SELECT 1` e não imprime erros do driver ou credenciais. Docker Compose disponibiliza PostgreSQL 17 local na porta 5433, restrita a 127.0.0.1, com volume persistente e healthcheck.

Documentação: `docs/pt-BR` e `docs/en-US`. Interface do produto permanece em português; internacionalização da aplicação não faz parte desta tarefa.

## Evolução planejada

Route Handlers tratarão transporte HTTP; módulos em `src/modules/<dominio>` serão criados conforme houver funcionalidades, separando validação Zod, serviços e acesso a dados. Infraestrutura compartilhada ficará em `src/lib` quando necessária. PostgreSQL é acessado por Prisma exclusivamente no servidor; o schema inicial e a primeira migration já existem.

Autenticação e autorização serão aplicadas no backend, com papéis OWNER, ADMIN e BARBER. O contexto de barbearia será derivado de uma sessão confiável. Entidades operacionais terão barbershopId. IDs fornecidos pelo cliente sempre serão verificados dentro desse contexto.

Disponibilidade considerará horário de funcionamento, barbeiro, duração do serviço, bloqueios, fuso e agendamentos existentes. A criação de agendamento exigirá garantia transacional de não sobreposição; uma consulta prévia isolada não impede duas reservas simultâneas.

Deploy planejado: GitHub, Vercel e PostgreSQL gerenciado, em etapa própria. O código está no GitHub; a aplicação ainda não foi implantada. PWA será adicionada após os fluxos principais; service worker não armazenará respostas autenticadas indiscriminadamente.

## Integridade implementada na BF-003

`User` é global; `BarbershopMember` associa usuário e papel por barbearia. `Barber` referencia essa participação. Chaves estrangeiras compostas impedem vincular agendamentos, bloqueios e lembretes a entidades de outra barbearia. Isso garante integridade de escrita; autorização de leitura e contexto da sessão ainda pertencem à BF-005 (não há RLS nesta etapa).

PostgreSQL aplica checks de dados e exclusão GiST com `btree_gist` para sobreposição de agendamentos por barbeiro e de horários de funcionamento por dia. A migration inclui SQL customizado não representável pelo Prisma. Os testes de integração exercitam SQL real, incluindo bloqueio entre duas transações independentes. O banco de testes é separado do banco da aplicação.

Preço em centavos e nome/duração do serviço são copiados no agendamento. A aplicação futura será responsável por copiar os valores corretos na criação e por regras de transição de status, consentimento, funcionamento e bloqueios. O banco impede overlaps entre agendamentos, mas ainda não cruza agendamentos com bloqueios ou horários de funcionamento.

## Dados fictícios — BF-004

O seed vive em prisma/seed-data.ts (fixtures), seed-demo.ts (transação) e seed.ts (entrada CLI). Usa IDs fixos, verificações de identidade/barbearia e inserções apenas de registros ausentes, sem atualizar ou apagar dados. Um advisory lock transacional serializa execuções concorrentes. O ambiente production é bloqueado. Não modifica o schema, a interface ou a API.
