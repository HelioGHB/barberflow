# BarberFlow

[Português (Brasil)](README.pt-BR.md) · [English (US)](README.md)

Gestão e agendamento para barbearias, pensados para uma rotina simples em smartphones Android.

## Estado do projeto

- **BF-001:** base Next.js, página inicial responsiva em português e ferramentas de qualidade.
- **BF-002:** configuração Prisma/PostgreSQL, banco local, diagnóstico de conexão e documentação bilíngue para GitHub.
- **BF-003:** schema de negócio, relacionamentos por barbearia, constraints SQL e migration inicial.
- **BF-004:** seed fictício repetível com 36 registros, verificação de conflitos e bloqueio em produção.
- **Próxima — BF-005:** autenticação e autorização por barbearia.

Login, cadastro de clientes, agendamentos e dashboards ainda não estão implementados. A interface usa português brasileiro; a documentação do repositório está disponível nos dois idiomas.

## Stack

Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, PostgreSQL 17 e Prisma 7.10.0. ESLint e Prettier verificam qualidade. Desenvolvimento e build usam a opção Webpack suportada pelo Next.js.

## Início rápido

Requisitos: Node.js 24, npm e Docker Compose v2 para o banco local opcional.

```sh
git clone https://github.com/HelioGHB/barberflow.git
cd barberflow
nvm use
npm ci
cp .env.example .env
npm run db:up
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

Abra http://localhost:3000. Se não usar nvm, instale Node.js 24 diretamente. A página inicial e o build funcionam sem banco ativo ou `.env`. A conexão exige `DATABASE_URL`; se preferir, use sua própria instância PostgreSQL em vez do Docker.

As credenciais de `.env.example` são exemplos locais deliberadamente públicos. Nunca usá-las em produção. Mantenha credenciais reais em arquivos de ambiente ignorados ou nos secrets da hospedagem.

## Validação

```sh
npm run check
npm test
npm run db:validate
npm run build
npm run db:check
```

`db:check` exige PostgreSQL. `npm run db:test` verifica integridade do schema em um banco separado, configurado por `TEST_DATABASE_URL`; veja o [guia do banco](docs/pt-BR/database.md) para prepará-lo uma vez. GitHub Actions executa qualidade, build de produção e um job separado de migrations e integridade PostgreSQL. Veja o [guia de desenvolvimento](docs/pt-BR/development.md) para as pendências conhecidas da auditoria de dependências.

## Documentação

- [Arquitetura](docs/pt-BR/architecture.md)
- [Configuração do banco](docs/pt-BR/database.md)
- [Estado da API](docs/pt-BR/api.md)
- [Desenvolvimento e fluxo GitHub](docs/pt-BR/development.md)
- [Roadmap](docs/pt-BR/roadmap.md)
- [Todos os documentos nos dois idiomas](docs/README.md)
- [Contribuição](CONTRIBUTING.md)

O desenvolvimento usa tarefas pequenas e validadas individualmente. IA, pagamentos, Pix, WhatsApp API, marketplace e SaaS comercial ficam fora do MVP inicial. Ainda não foi escolhida uma licença; publicar o repositório não concede uma licença de código aberto.

## Dados de demonstração

`npm run db:seed` cria explicitamente a barbearia `barberflow-demo` e dados fictícios de desenvolvimento após as migrations. Repetir preserva registros e edições existentes. Emails usam `.invalid`, telefones usam a faixa NANPA reservada 555-0100–0199 e consentimento WhatsApp começa desativado. Não há senhas de login ou envio de mensagens. As datas são fixas em torno da referência de 7 de outubro de 2026; o seed não move agendamentos conforme o tempo passa. O comando é bloqueado quando NODE_ENV=production. Veja os [detalhes do seed](docs/pt-BR/seed.md).
