# Seed de demonstração — BF-004

[English (US)](../en-US/seed.md)

## Executar

Com PostgreSQL de desenvolvimento configurado em DATABASE_URL:

```sh
npm run db:migrate
npm run db:seed
```

O comando é explícito. Não é executado durante npm ci, build ou migration. A barbearia criada tem slug `barberflow-demo`, nome com indicação fictícia e fuso America/Sao_Paulo. NODE_ENV=production bloqueia a execução antes da conexão. Essa verificação não identifica sozinha se um banco contém dados reais: configure DATABASE_URL para o ambiente de desenvolvimento adequado.

## Conteúdo inicial

| Modelo           | Quantidade | Exemplo                                                          |
| ---------------- | ---------- | ---------------------------------------------------------------- |
| User             | 3          | owner/admin/barber em emails .invalid, sem senha ou login        |
| Barbershop       | 1          | BarberFlow Demo — Fictícia                                       |
| BarbershopMember | 3          | OWNER, ADMIN, BARBER                                             |
| Barber           | 2          | Proprietário atende e há um segundo profissional                 |
| Customer         | 4          | Contatos fictícios, consentimento WhatsApp false                 |
| Service          | 3          | Corte R$ 50/30 min, barba R$ 35/20 min, combo R$ 80/50 min       |
| Appointment      | 5          | SCHEDULED, dois COMPLETED, CANCELLED e NO_SHOW                   |
| BusinessHour     | 12         | Segunda a sábado: 09–12 e 14–18 locais                           |
| BlockedPeriod    | 2          | Bloqueio geral e pausa de um barbeiro                            |
| CustomerReminder | 1          | PENDING para cliente com atendimento antigo, sem contato enviado |

Total: 36 registros com IDs fixos. As datas não dependem do relógio: são exemplos relativos a 07/10/2026. Atendimento antigo: 20/08/2026; recente: 30/09; falta: 01/10; agenda/cancelamento/bloqueios: 08/10. O seed não move a agenda ou recalcula inatividade ao ser repetido. O prazo de inatividade será definido na funcionalidade futura.

Telefones +1 202 555-0101 a 0104 pertencem à [faixa fictícia reservada pela NANPA](https://nanpa.com/numbering/555-line-numbers); não são números brasileiros nem clientes reais. Emails usam `.invalid`. Não há senha, credencial de autenticação, pagamento ou envio de mensagem. Os dados não aparecem automaticamente na página inicial, que continua estática.

## Repetição e conflitos

IDs fixos e createMany/skipDuplicates criam apenas registros ausentes. Linhas existentes, incluindo createdAt/updatedAt e edições de nome, preço, consentimento ou status, não são atualizadas. Reexecutar pode restaurar fixtures removidas quando não há conflito. Não limpa a demonstração nem outros registros.

A transação usa advisory lock 42004 para serializar dois seeds simultâneos. Verifica que o ID da barbearia conserva o slug demo, que IDs globais dos usuários conservam seus emails e que IDs operacionais existentes pertencem à barbearia demo. Mudança de slug/email considerados identidade exige intervenção manual, sem sobrescrita automática.

Um conflito de slug, email, telefone, FK ou intervalo pode impedir completar uma fixture. Os IDs finais são verificados para evitar sucesso silencioso quando PostgreSQL skipDuplicates evita uma inserção. Falha reverte todas as inserções daquela execução, preservando o que já existia. Não há reset, truncate, exclusão de dados ou alteração de migration. O CLI não imprime erros brutos do driver, URLs ou credenciais.

## Testes

```sh
npm run db:test
```

Usa TEST_DATABASE_URL em banco separado, como descrito em [database.md](database.md). Os sete testes novos verificam CLI bloqueado em produção sem expor senha; conteúdo e repetição; preservação de edições sob seeds concorrentes; dados de outra barbearia; ID pertencente a outra barbearia; rollback após conflito de slug; e rollback após conflito de agendamento com lembrete parcialmente inserido.

A suíte recusa rodar os testes de seed se os IDs/slug/emails de demonstração já existirem no banco de testes, para não apagar uma demonstração anterior. Se isso ocorrer, escolha outro banco isolado. Fixtures criadas pela execução são removidas no final; os 11 testes de schema continuam ativos. A CI também executa o comando oficial Prisma duas vezes em seu banco efêmero de aplicação.

Referência do hook: [Prisma config](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).
