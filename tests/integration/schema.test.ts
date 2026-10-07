import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import pg from "pg";
import { createPrismaClient } from "../../src/lib/prisma-client";

if (
  !process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL
) {
  throw new Error(
    "Run through npm run db:test with a separate TEST_DATABASE_URL.",
  );
}

const prisma = createPrismaClient();
const token = randomUUID();
const shopIds: string[] = [];
const userIds: string[] = [];
let f: {
  shop: string;
  otherShop: string;
  user: string;
  barber: string;
  otherBarber: string;
  colleague: string;
  customer: string;
  otherCustomer: string;
  service: string;
  otherService: string;
};

function sqlClient() {
  return new pg.Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
  });
}

before(
  async () => {
    const user = await prisma.user.create({
      data: { name: "Schema Test", email: `${token}@example.invalid` },
    });
    userIds.push(user.id);
    const colleague = await prisma.user.create({
      data: { name: "Colleague Test", email: `other-${token}@example.invalid` },
    });
    userIds.push(colleague.id);
    for (const suffix of ["one", "two"]) {
      const shop = await prisma.barbershop.create({
        data: { name: "Schema Test", slug: `test-${token}-${suffix}` },
      });
      shopIds.push(shop.id);
    }
    const [shop, otherShop] = shopIds;
    await prisma.barbershopMember.createMany({
      data: [
        { barbershopId: shop, userId: user.id, role: "OWNER" },
        { barbershopId: otherShop, userId: user.id, role: "ADMIN" },
        { barbershopId: shop, userId: colleague.id, role: "BARBER" },
      ],
    });
    const barber = await prisma.barber.create({
      data: {
        barbershopId: shop,
        userId: user.id,
        displayName: "Owner Barber",
      },
    });
    const otherBarber = await prisma.barber.create({
      data: {
        barbershopId: otherShop,
        userId: user.id,
        displayName: "Other Shop Barber",
      },
    });
    const secondBarber = await prisma.barber.create({
      data: {
        barbershopId: shop,
        userId: colleague.id,
        displayName: "Colleague",
      },
    });
    const customer = await prisma.customer.create({
      data: {
        barbershopId: shop,
        name: "Fixture Customer",
        phone: "+5511999990000",
      },
    });
    const otherCustomer = await prisma.customer.create({
      data: {
        barbershopId: otherShop,
        name: "Other Customer",
        phone: customer.phone,
      },
    });
    const service = await prisma.service.create({
      data: {
        barbershopId: shop,
        name: "Haircut",
        priceCents: 5000,
        durationMinutes: 30,
      },
    });
    const otherService = await prisma.service.create({
      data: {
        barbershopId: otherShop,
        name: "Other Haircut",
        priceCents: 6000,
        durationMinutes: 30,
      },
    });
    f = {
      shop,
      otherShop,
      user: user.id,
      barber: barber.id,
      otherBarber: otherBarber.id,
      colleague: secondBarber.id,
      customer: customer.id,
      otherCustomer: otherCustomer.id,
      service: service.id,
      otherService: otherService.id,
    };
  },
  { timeout: 20_000 },
);

after(async () => {
  try {
    const where = { barbershopId: { in: shopIds } };
    // Only delete this run's UUID-scoped fixtures, never reset or truncate tables.
    await prisma.$transaction(async (tx) => {
      await tx.customerReminder.deleteMany({ where });
      await tx.blockedPeriod.deleteMany({ where });
      await tx.businessHour.deleteMany({ where });
      await tx.appointment.deleteMany({ where });
      await tx.service.deleteMany({ where });
      await tx.customer.deleteMany({ where });
      await tx.barber.deleteMany({ where });
      await tx.barbershopMember.deleteMany({ where });
      await tx.barbershop.deleteMany({ where: { id: { in: shopIds } } });
      await tx.user.deleteMany({ where: { id: { in: userIds } } });
    });
  } finally {
    await prisma.$disconnect();
  }
});

async function rollbackTest(action: (client: pg.Client) => Promise<void>) {
  const client = sqlClient();
  await client.connect();
  try {
    await client.query("BEGIN");
    await action(client);
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
}

async function rejectsSql(
  client: pg.Client,
  code: string,
  constraint: string | string[],
  action: () => Promise<unknown>,
) {
  await client.query("SAVEPOINT expected_failure");
  try {
    await assert.rejects(action, (error: unknown) => {
      assert.ok(error instanceof pg.DatabaseError);
      assert.equal(error.code, code);
      if (Array.isArray(constraint))
        assert.ok(constraint.includes(error.constraint ?? ""));
      else assert.equal(error.constraint, constraint);
      return true;
    });
  } finally {
    await client.query("ROLLBACK TO SAVEPOINT expected_failure");
    await client.query("RELEASE SAVEPOINT expected_failure");
  }
}

const appointmentSql = `INSERT INTO "Appointment" ("barbershopId", "barberId", "customerId", "serviceId", "startsAt", "endsAt", "serviceName", "servicePriceCents", "serviceDurationMinutes", "status", "updatedAt") VALUES ($1,$2,$3,$4,$5,$6,'Haircut',5000,30,$7,NOW()) RETURNING "id"`;
function appointmentValues(
  start = "2030-10-07T10:00:00Z",
  end = "2030-10-07T10:30:00Z",
  status = "SCHEDULED",
  barber = f.barber,
) {
  return [f.shop, barber, f.customer, f.service, start, end, status];
}

// These exercise real PostgreSQL errors; assertions are not schema-text snapshots.
test("membership roles belong to each shop and customer phone uniqueness is scoped", async () => {
  const memberships = await prisma.barbershopMember.findMany({
    where: { userId: f.user },
    orderBy: { role: "asc" },
  });
  assert.deepEqual(
    new Set(memberships.map((m) => m.role)),
    new Set(["OWNER", "ADMIN"]),
  );
  assert.equal(
    await prisma.customer.count({
      where: { id: { in: [f.customer, f.otherCustomer] } },
    }),
    2,
  );
  await rollbackTest(async (c) => {
    await rejectsSql(c, "23505", "Customer_barbershopId_phone_key", () =>
      c.query(
        'INSERT INTO "Customer" ("barbershopId","name","phone","updatedAt") VALUES ($1,\'Duplicate\',\'+5511999990000\',NOW())',
        [f.shop],
      ),
    );
    await rejectsSql(c, "23503", "Barber_barbershopId_userId_fkey", () =>
      c.query('UPDATE "Barber" SET "userId" = $1 WHERE "id" = $2', [
        randomUUID(),
        f.barber,
      ]),
    );
  });
});

test("names, canonical emails, slugs, phone format and timezone are checked in PostgreSQL", async () => {
  await rollbackTest(async (c) => {
    await rejectsSql(c, "23514", "User_name_not_blank", () =>
      c.query('UPDATE "User" SET "name" = \'  \' WHERE "id" = $1', [f.user]),
    );
    await rejectsSql(c, "23514", "User_email_normalized", () =>
      c.query(
        'UPDATE "User" SET "email" = \'Upper@example.invalid\' WHERE "id" = $1',
        [f.user],
      ),
    );
    await rejectsSql(c, "23514", "Barbershop_slug_format", () =>
      c.query(
        'UPDATE "Barbershop" SET "slug" = \'Invalid slug\' WHERE "id" = $1',
        [f.shop],
      ),
    );
    await rejectsSql(c, "23514", "Barbershop_timezone_valid", () =>
      c.query(
        'UPDATE "Barbershop" SET "timezone" = \'Mars/Olympus\' WHERE "id" = $1',
        [f.shop],
      ),
    );
    await rejectsSql(c, "23514", "Customer_phone_e164", () =>
      c.query(
        'UPDATE "Customer" SET "phone" = \'11999990000\' WHERE "id" = $1',
        [f.customer],
      ),
    );
  });
});

test("services reject negative prices and nonpositive durations while accepting free services", async () => {
  await rollbackTest(async (c) => {
    await rejectsSql(c, "23514", "Service_price_nonnegative", () =>
      c.query('UPDATE "Service" SET "priceCents" = -1 WHERE "id" = $1', [
        f.service,
      ]),
    );
    for (const duration of [0, -1]) {
      await rejectsSql(c, "23514", "Service_duration_positive", () =>
        c.query('UPDATE "Service" SET "durationMinutes" = $1 WHERE "id" = $2', [
          duration,
          f.service,
        ]),
      );
    }
    await c.query('UPDATE "Service" SET "priceCents" = 0 WHERE "id" = $1', [
      f.service,
    ]);
  });
});

test("appointments cannot reference a barber, customer or service in another shop", async () => {
  await rollbackTest(async (c) => {
    for (const [index, id, constraint] of [
      [1, f.otherBarber, "Appointment_barbershopId_barberId_fkey"],
      [2, f.otherCustomer, "Appointment_barbershopId_customerId_fkey"],
      [3, f.otherService, "Appointment_barbershopId_serviceId_fkey"],
    ] as const) {
      const values = appointmentValues();
      values[index] = id;
      await rejectsSql(c, "23503", constraint, () =>
        c.query(appointmentSql, values),
      );
    }
  });
});

test("appointment intervals match positive snapshots and completion status", async () => {
  await rollbackTest(async (c) => {
    await rejectsSql(
      c,
      "23514",
      ["Appointment_interval_valid", "Appointment_duration_matches"],
      () =>
        c.query(
          appointmentSql,
          appointmentValues("2030-10-07T10:00Z", "2030-10-07T10:00Z"),
        ),
    );
    await rejectsSql(c, "23514", "Appointment_duration_matches", () =>
      c.query(
        appointmentSql,
        appointmentValues("2030-10-07T10:00Z", "2030-10-07T10:45Z"),
      ),
    );
    await rejectsSql(c, "23514", "Appointment_completion_valid", () =>
      c.query(
        appointmentSql,
        appointmentValues(undefined, undefined, "COMPLETED"),
      ),
    );
    const created = await c.query(appointmentSql, appointmentValues());
    const id = created.rows[0].id;
    await rejectsSql(c, "23514", "Appointment_snapshot_valid", () =>
      c.query(
        'UPDATE "Appointment" SET "servicePriceCents" = -1 WHERE "id" = $1',
        [id],
      ),
    );
    await c.query(
      'UPDATE "Appointment" SET "status" = \'COMPLETED\', "completedAt" = \'2030-10-07T10:30Z\' WHERE "id" = $1',
      [id],
    );
    await c.query(
      'UPDATE "Service" SET "name" = \'New Name\', "priceCents" = 9000, "durationMinutes" = 60 WHERE "id" = $1',
      [f.service],
    );
    const snapshot = await c.query(
      'SELECT "serviceName", "servicePriceCents", "serviceDurationMinutes" FROM "Appointment" WHERE "id" = $1',
      [id],
    );
    assert.deepEqual(snapshot.rows[0], {
      serviceName: "Haircut",
      servicePriceCents: 5000,
      serviceDurationMinutes: 30,
    });
  });
});

test("overlap is rejected on insert and update; adjacent and other-barber slots are accepted", async () => {
  await rollbackTest(async (c) => {
    await c.query(appointmentSql, appointmentValues());
    await rejectsSql(c, "23P01", "Appointment_no_overlap", () =>
      c.query(
        appointmentSql,
        appointmentValues("2030-10-07T10:15Z", "2030-10-07T10:45Z"),
      ),
    );
    const adjacent = await c.query(
      appointmentSql,
      appointmentValues("2030-10-07T10:30Z", "2030-10-07T11:00Z"),
    );
    await rejectsSql(c, "23P01", "Appointment_no_overlap", () =>
      c.query(
        'UPDATE "Appointment" SET "startsAt" = \'2030-10-07T10:15Z\', "endsAt" = \'2030-10-07T10:45Z\' WHERE "id" = $1',
        [adjacent.rows[0].id],
      ),
    );
    await c.query(
      appointmentSql,
      appointmentValues(undefined, undefined, undefined, f.colleague),
    );
  });
});

test("cancellation releases a slot, but reactivation, completed visits and no-shows cannot overlap", async () => {
  await rollbackTest(async (c) => {
    const cancelled = await c.query(
      appointmentSql,
      appointmentValues(undefined, undefined, "CANCELLED"),
    );
    const scheduled = await c.query(appointmentSql, appointmentValues());
    await rejectsSql(c, "23P01", "Appointment_no_overlap", () =>
      c.query(
        'UPDATE "Appointment" SET "status" = \'SCHEDULED\' WHERE "id" = $1',
        [cancelled.rows[0].id],
      ),
    );
    for (const status of ["NO_SHOW", "COMPLETED"]) {
      await c.query(
        'UPDATE "Appointment" SET "status" = $1::"AppointmentStatus", "completedAt" = CASE WHEN $1::"AppointmentStatus" = \'COMPLETED\' THEN \'2030-10-07T10:30Z\'::timestamptz ELSE NULL END WHERE "id" = $2',
        [status, scheduled.rows[0].id],
      );
      await rejectsSql(c, "23P01", "Appointment_no_overlap", () =>
        c.query(appointmentSql, appointmentValues()),
      );
    }
  });
});

test("business hours allow split days and midnight endings while rejecting invalid/overlapping intervals", async () => {
  await rollbackTest(async (c) => {
    const sql =
      'INSERT INTO "BusinessHour" ("barbershopId","weekday","startMinute","endMinute","updatedAt") VALUES ($1,$2,$3,$4,NOW())';
    await c.query(sql, [f.shop, 1, 540, 720]);
    await c.query(sql, [f.shop, 1, 780, 1440]);
    await rejectsSql(c, "23P01", "BusinessHour_no_overlap", () =>
      c.query(sql, [f.shop, 1, 600, 750]),
    );
    await rejectsSql(c, "23514", "BusinessHour_weekday_valid", () =>
      c.query(sql, [f.shop, 7, 540, 600]),
    );
    await rejectsSql(c, "23514", "BusinessHour_interval_valid", () =>
      c.query(sql, [f.shop, 2, -1, 60]),
    );
    await rejectsSql(c, "23514", "BusinessHour_interval_valid", () =>
      c.query(sql, [f.shop, 2, 1200, 1441]),
    );
  });
});

test("blocked periods and reminders preserve tenant integrity and valid dates", async () => {
  await rollbackTest(async (c) => {
    const block =
      'INSERT INTO "BlockedPeriod" ("barbershopId","barberId","startsAt","endsAt","updatedAt") VALUES ($1,$2,$3,$4,NOW())';
    await c.query(block, [
      f.shop,
      null,
      "2030-10-07T12:00Z",
      "2030-10-07T13:00Z",
    ]);
    await c.query(block, [
      f.shop,
      f.barber,
      "2030-10-07T12:00Z",
      "2030-10-07T13:00Z",
    ]);
    await rejectsSql(
      c,
      "23503",
      "BlockedPeriod_barbershopId_barberId_fkey",
      () =>
        c.query(block, [
          f.shop,
          f.otherBarber,
          "2030-10-07T12:00Z",
          "2030-10-07T13:00Z",
        ]),
    );
    await rejectsSql(c, "23514", "BlockedPeriod_interval_valid", () =>
      c.query(block, [f.shop, null, "2030-10-07T12:00Z", "2030-10-07T12:00Z"]),
    );
    const reminder =
      'INSERT INTO "CustomerReminder" ("barbershopId","customerId","updatedAt") VALUES ($1,$2,NOW()) RETURNING "id"';
    await rejectsSql(
      c,
      "23503",
      "CustomerReminder_barbershopId_customerId_fkey",
      () => c.query(reminder, [f.shop, f.otherCustomer]),
    );
    const created = await c.query(reminder, [f.shop, f.customer]);
    await rejectsSql(c, "23514", "CustomerReminder_contact_valid", () =>
      c.query(
        'UPDATE "CustomerReminder" SET "status" = \'CONTACTED\' WHERE "id" = $1',
        [created.rows[0].id],
      ),
    );
    await c.query(
      'UPDATE "CustomerReminder" SET "status" = \'CONTACTED\', "contactedAt" = NOW() WHERE "id" = $1',
      [created.rows[0].id],
    );
  });
});

test("referenced operational history cannot be deleted through cascading parent removal", async () => {
  await rollbackTest(async (c) => {
    await c.query(appointmentSql, appointmentValues());
    for (const [table, id, constraint] of [
      ["Customer", f.customer, "Appointment_barbershopId_customerId_fkey"],
      ["Service", f.service, "Appointment_barbershopId_serviceId_fkey"],
      ["Barber", f.barber, "Appointment_barbershopId_barberId_fkey"],
    ]) {
      await rejectsSql(c, "23503", constraint, () =>
        c.query(`DELETE FROM "${table}" WHERE "id" = $1`, [id]),
      );
    }
  });
});

test(
  "two independent PostgreSQL transactions cannot both reserve an overlapping slot",
  { timeout: 15_000 },
  async () => {
    const first = sqlClient();
    const second = sqlClient();
    const observer = sqlClient();
    await Promise.all([first.connect(), second.connect(), observer.connect()]);
    try {
      await first.query("BEGIN");
      await second.query("BEGIN");
      const pid = (await second.query("SELECT pg_backend_pid() AS pid")).rows[0]
        .pid;
      const values = appointmentValues(
        "2030-10-07T14:00Z",
        "2030-10-07T14:30Z",
      );
      await first.query(appointmentSql, values);
      const pending = second.query(appointmentSql, values).then(
        () => ({ ok: true, error: undefined }),
        (error: unknown) => ({ ok: false, error }),
      );
      let waiting = false;
      const deadline = Date.now() + 3_000;
      while (Date.now() < deadline) {
        const state = await observer.query(
          "SELECT wait_event_type FROM pg_stat_activity WHERE pid = $1",
          [pid],
        );
        if (state.rows[0]?.wait_event_type === "Lock") {
          waiting = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      assert.ok(
        waiting,
        "The second transaction must wait on the first reservation.",
      );
      await first.query("COMMIT");
      const result = await pending;
      assert.equal(result.ok, false);
      assert.ok(result.error instanceof pg.DatabaseError);
      assert.equal(result.error.code, "23P01");
      assert.equal(result.error.constraint, "Appointment_no_overlap");
      await second.query("ROLLBACK");
      assert.equal(
        await prisma.appointment.count({
          where: {
            barbershopId: f.shop,
            barberId: f.barber,
            startsAt: new Date(values[4]),
          },
        }),
        1,
      );
    } finally {
      await Promise.allSettled([
        first.query("ROLLBACK"),
        second.query("ROLLBACK"),
      ]);
      await Promise.all([first.end(), second.end(), observer.end()]);
    }
  },
);
