# Demo seed — BF-004

[Português (Brasil)](../pt-BR/seed.md)

## Run

With development PostgreSQL configured through DATABASE_URL:

```sh
npm run db:migrate
npm run db:seed
```

This is an explicit command. npm ci, builds and migration deployment do not run it. The created shop has slug `barberflow-demo`, a name labeling it fictitious and timezone America/Sao_Paulo. NODE_ENV=production blocks execution before connecting. This check alone cannot establish whether a database contains real data: point DATABASE_URL at the appropriate development environment.

## Initial content

| Model            | Count | Example                                                          |
| ---------------- | ----- | ---------------------------------------------------------------- |
| User             | 3     | owner/admin/barber with .invalid emails, no password or login    |
| Barbershop       | 1     | BarberFlow Demo — Fictícia                                       |
| BarbershopMember | 3     | OWNER, ADMIN, BARBER                                             |
| Barber           | 2     | The owner provides services alongside a second professional      |
| Customer         | 4     | Fictitious contacts, WhatsApp consent false                      |
| Service          | 3     | Haircut BRL 50/30 min, beard BRL 35/20 min, combo BRL 80/50 min  |
| Appointment      | 5     | SCHEDULED, two COMPLETED, CANCELLED and NO_SHOW                  |
| BusinessHour     | 12    | Monday–Saturday: 09–12 and 14–18 local time                      |
| BlockedPeriod    | 2     | Shop-wide closure and one barber's break                         |
| CustomerReminder | 1     | PENDING for a customer with an older visit, no contact delivered |

Total: 36 records with fixed IDs. Dates do not depend on the clock: examples use an October 7, 2026 reference date. Older visit: August 20; recent visit: September 30; no-show: October 1; scheduled/canceled appointments and blocks: October 8. Repetition does not move bookings or recalculate inactivity. The inactivity threshold belongs to its future feature.

Phones +1 202 555-0101 through 0104 belong to [NANPA's reserved fictitious range](https://nanpa.com/numbering/555-line-numbers); they are not Brazilian numbers or actual customers. Emails use `.invalid`. There are no passwords, authentication credentials, payments or message deliveries. Seed data does not automatically appear on the static landing page.

## Repetition and conflicts

Fixed IDs and createMany/skipDuplicates insert only missing records. Existing rows, including createdAt/updatedAt and edits to names, prices, consent or statuses, are not updated. Repetition can restore removed fixtures when there is no conflict. It does not clear demo data or other records.

A transaction uses advisory lock 42004 to serialize concurrent seeds. It verifies that the shop ID retains the demo slug, global user IDs retain their emails and existing operational IDs belong to the demo shop. Changes to identity slugs/emails require manual resolution rather than automatic overwrites.

Slug, email, phone, foreign-key or interval conflicts can prevent a fixture from being completed. Final IDs are checked to avoid silent success when PostgreSQL skipDuplicates skips an insert. Failure rolls back all inserts from that execution, preserving prior data. There are no resets, truncates, data deletions or migration edits. The CLI does not print raw driver errors, URLs or credentials.

## Tests

```sh
npm run db:test
```

Uses TEST_DATABASE_URL in a separate database as described in [database.md](database.md). Seven new tests verify a production-blocked CLI without credential exposure; content and repetition; edited records under concurrent seeds; another shop's data; an ID owned by another shop; rollback after a slug collision; and rollback after a booking conflict with a partially inserted reminder.

The seed suite refuses to run when demo IDs/slugs/emails already exist in the test database, avoiding deletion of an earlier demo. Choose another isolated database in that case. Run-created fixtures are removed afterwards; the 11 schema tests remain active. CI also runs the official Prisma command twice in its ephemeral application database.

Hook reference: [Prisma configuration](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).
