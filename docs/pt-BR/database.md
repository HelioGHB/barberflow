# Banco de dados

[English (US)](../en-US/database.md)

## Implementado até a BF-004

Prisma 7.10.0, adaptador PostgreSQL, dez modelos de negócio e a primeira migration SQL. O cliente é gerado em `src/generated/prisma`, ignorado pelo Git. A configuração do CLI está em `prisma.config.ts`; a conexão da aplicação está em `src/lib/prisma.ts`. A migration inicial está versionada; BF-004 adiciona o [seed fictício repetível](seed.md).

## PostgreSQL local

Requer Docker Desktop iniciado e Compose v2.

```sh
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:validate
npm run db:generate
npm run db:check
```

`db:up` aguarda o healthcheck do PostgreSQL 17. Porta padrão: `127.0.0.1:5433`; usuário/banco de exemplo: `barberflow`. A senha pública de exemplo serve exclusivamente para desenvolvimento local. O volume `barberflow_postgres_data` preserva dados. `npm run db:down` encerra o serviço sem apagar esse volume. Não use `down -v` se quiser preservar dados.

Para mudar usuário, senha, banco ou porta, atualize as variáveis `POSTGRES_*` e a `DATABASE_URL` de forma coerente. As variáveis `POSTGRES_*` inicializam apenas volumes novos; alterá-las não muda automaticamente a senha ou banco de um volume existente. Não apague volumes para contornar uma falha de autenticação sem avaliar os dados existentes.

## Outra instância PostgreSQL

Configure `DATABASE_URL` em `.env` ou no ambiente. Exemplo de formato: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`. Codifique caracteres especiais de usuário/senha na URL. Na hospedagem, configure os secrets com os valores reais e use a configuração TLS indicada pelo provedor; o código não desabilita validação de certificados.

`@next/env` carrega os arquivos de ambiente com as regras do Next.js tanto no CLI Prisma quanto no diagnóstico. Sem URL, geração, validação de schema e build continuam funcionando. A conexão exige URL PostgreSQL válida e informa falha sem expor seu conteúdo. `db:check` executa somente `SELECT 1`; não cria tabelas nem altera dados.

O pool usa até cinco conexões por processo, timeout de conexão de cinco segundos e descarte de conexão ociosa após dez segundos. Avaliar orçamento de conexões e pooler do provedor antes do deploy. `getPrisma()` reutiliza cliente durante hot reload e abre a conexão sob demanda. Imports do cliente e da fábrica são protegidos por `server-only`. O diagnóstico usa a condição Node `react-server` para acessar esses módulos fora do Next.js.

## Modelo inicial — BF-003

| Entidade         | Responsabilidade                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| User             | Identidade global, nome, email normalizado e estado ativo; login ainda não implementado                |
| Barbershop       | Nome, slug único e fuso validado pelo PostgreSQL; padrão America/Sao_Paulo                             |
| BarbershopMember | Associação usuário/barbearia com um papel OWNER, ADMIN ou BARBER por estabelecimento                   |
| Barber           | Profissional vinculado à participação do usuário na mesma barbearia; OWNER/ADMIN também podem atender  |
| Customer         | Cliente por barbearia, telefone E.164 único dentro dela e consentimento WhatsApp desativado por padrão |
| Service          | Nome, preço inteiro em centavos (BRL no MVP), duração positiva em minutos e estado ativo               |
| Appointment      | Cliente/barbeiro/serviço da mesma barbearia, instantes UTC, status e cópia histórica do serviço        |
| BusinessHour     | Intervalo de funcionamento por dia da semana em minutos locais                                         |
| BlockedPeriod    | Intervalo UTC para um barbeiro ou toda a barbearia (barberId nulo)                                     |
| CustomerReminder | Registro de reativação manual de cliente com status PENDING, CONTACTED ou DISMISSED                    |

```mermaid
erDiagram
  User ||--o{ BarbershopMember : participacoes
  Barbershop ||--o{ BarbershopMember : equipe
  BarbershopMember ||--o| Barber : profissional
  Barbershop ||--o{ Customer : clientes
  Barbershop ||--o{ Service : servicos
  Barbershop ||--o{ BusinessHour : funcionamento
  Barbershop ||--o{ BlockedPeriod : bloqueios
  Barber ||--o{ Appointment : atende
  Customer ||--o{ Appointment : agenda
  Service ||--o{ Appointment : referencia
  Customer ||--o{ CustomerReminder : reativacao
```

## Constraints e decisões

As entidades usam UUIDs gerados pelo PostgreSQL. Participação tem chave composta (barbershopId, userId); entidades referenciadas expõem chaves únicas (barbershopId, id). As FKs compostas de agendamentos, bloqueios e lembretes impedem referências entre barbearias. Exclusão/alteração de pais referenciados usa RESTRICT; desativação lógica preserva histórico. Usuários podem participar de mais de uma barbearia com papéis diferentes.

Checks rejeitam nomes vazios, email sem normalização minúscula/trim, slug inválido, telefone fora do formato E.164, fuso inexistente, preço negativo, duração não positiva e intervalos inválidos/infinitos. A validação completa de email, normalização de telefone e permissões ainda serão aplicadas no backend; o banco não comprova a titularidade de email/telefone.

Agendamentos possuem serviceName, servicePriceCents e serviceDurationMinutes próprios. O fim deve corresponder ao início mais a duração copiada. Alterar o serviço não modifica o histórico; a futura aplicação copiará esses dados ao criar a reserva. Status: SCHEDULED, COMPLETED, CANCELLED, NO_SHOW. Apenas COMPLETED exige completedAt; outros estados não permitem esse campo. CONTACTED exige contactedAt no lembrete. Regras de transição de status e de consentimento permanecem nas próximas etapas.

A constraint `Appointment_no_overlap` usa GiST, `btree_gist` e intervalo `[início, fim)`. Impede sobreposição inclusive sob concorrência para a mesma barbearia/barbeiro, permitindo horários adjacentes e barbeiros distintos. CANCELLED libera o intervalo; COMPLETED e NO_SHOW preservam a ocupação histórica. Reativar um cancelado também respeita a constraint.

Funcionamento: weekday 0 (domingo) a 6 (sábado), startMinute >= 0, endMinute <= 1440 e início anterior ao fim. Aceita múltiplos intervalos por dia e fim à meia-noite, sem sobreposições. Funcionamento atravessando meia-noite deve ser dividido entre dias. Bloqueios podem se sobrepor e serão tratados como união de intervalos na futura disponibilidade.

A migration não verifica reservas contra bloqueios ou funcionamento: essas regras exigem o backend de disponibilidade e uma estratégia transacional entre alterações desses dados e reservas. FKs não substituem autorização de leitura/escrita por sessão; ainda não há RLS, autenticação, CRUD ou envio de mensagens; o seed fictício está disponível. `updatedAt` é mantido pelo Prisma; escrituras SQL diretas devem fornecê-lo/atualizá-lo.

## Migrations

```sh
npm run db:migrate
npm run db:migrate:status
npm run db:drift
```

`db:migrate` aplica migrations revisadas (`prisma migrate deploy`) sem resetar o banco. A primeira é `20261007120000_initial_schema`, transacional, com extensão `btree_gist`, função de validação de fuso, checks e exclusões. O usuário de migration precisa poder criar a extensão (disponível no PostgreSQL 17 padrão). As funções auxiliares usam o schema public.

Para alterações futuras: `npm run db:migrate:dev -- --name nome --create-only`, revisar o SQL e só então aplicar no banco de desenvolvimento. Nunca alterar uma migration já aplicada. Não usar `db push` para substituir migrations. CHECKs, função de fuso e exclusões não estão representados integralmente no schema Prisma; `db:drift` compara apenas o que o Prisma reconhece. Os testes de integração verificam as regras SQL customizadas.

## Testes isolados

Configure TEST_DATABASE_URL para outro banco PostgreSQL. Com os valores de exemplo, crie-o uma vez:

```sh
docker compose exec db createdb -U barberflow barberflow_schema_test
npm run db:test
```

Se o banco já existir, não repita o createdb. Adapte usuário/endereço à sua instalação. O executor rejeita o mesmo nome de banco usado por DATABASE_URL, mesmo com alias de host ou schema diferente. Aplica a migration no banco de testes, repete para comprovar idempotência, verifica drift e executa 18 testes reais (11 de schema e sete de seed). Transações usuais são revertidas; fixtures persistentes do teste de concorrência são removidas somente pelos UUIDs criados pela execução. Não há truncate, reset ou exclusão de banco.

CI cria bancos separados para aplicação e integração, aplica as migrations e executa a mesma suíte. O teste de concorrência observa uma transação aguardando lock da outra, confirma erro PostgreSQL 23P01 e apenas uma reserva persistida.

Próxima etapa: BF-005, autenticação e autorização por barbearia.

Referências: [Prisma migrations customizadas](https://www.prisma.io/docs/orm/v7/prisma-migrate/workflows/customizing-migrations), [PostgreSQL ranges](https://www.postgresql.org/docs/17/rangetypes.html) e [btree_gist](https://www.postgresql.org/docs/17/btree-gist.html).
