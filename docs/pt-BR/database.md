# Banco de dados

[English (US)](../en-US/database.md)

## Implementado na BF-002

Prisma 7.10.0, adaptador PostgreSQL e schema sem modelos de negócio. O cliente é gerado em `src/generated/prisma`, ignorado pelo Git. A configuração do CLI está em `prisma.config.ts`; a conexão da aplicação está em `src/lib/prisma.ts`. Ainda não existem migrations ou seed.

## PostgreSQL local

Requer Docker Desktop iniciado e Compose v2.

```sh
cp .env.example .env
npm run db:up
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

## Próxima etapa: BF-003

Revisar User, Barbershop, Barber, Customer, Service, Appointment, BusinessHour, BlockedPeriod e CustomerReminder; papéis OWNER, ADMIN, BARBER. Entidades operacionais devem considerar barbershopId e impedir referências entre barbearias. Definir pertencimento e papel do usuário antes do schema.

Criar índices para agenda por barbearia, barbeiro e período e histórico por cliente. Preços não usam ponto flutuante. Persistir instantes em UTC e preservar duração/preço do atendimento. Funcionamento usa dia da semana e hora local com fuso IANA e múltiplos intervalos por dia. Definir status, constraints de duração/início/fim e proteção contra reservas concorrentes antes da primeira migration. Seed fictício pertence à BF-004.

Referência: [configuração Prisma](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference) e [gerador/adaptadores Prisma 7](https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7).
