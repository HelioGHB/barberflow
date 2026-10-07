import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { after, before, test } from "node:test";
import { createPrismaClient } from "../../src/lib/prisma-client";
import { seedDemo } from "../../prisma/seed-demo";
import { DemoSeedError } from "../../prisma/seed-environment";
import {
  demoShopId,
  demoSlug,
  demoUsers,
  demoServices,
  demoCustomers,
  demoAppointments,
  demoBarbers,
  demoReminders,
} from "../../prisma/seed-data";

if (
  !process.env.TEST_DATABASE_URL ||
  process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL
) {
  throw new Error(
    "Run through npm run db:test with a separate TEST_DATABASE_URL.",
  );
}
const prisma = createPrismaClient();
let ownsNamespace = false;
const otherShopId = randomUUID();
const otherUserId = randomUUID();
const otherCustomerId = randomUUID();

before(async () => {
  const occupied = await prisma.barbershop.count({
    where: { OR: [{ id: demoShopId }, { slug: demoSlug }] },
  });
  const users = await prisma.user.count({
    where: {
      OR: [
        { id: { in: demoUsers.map((u) => u.id) } },
        { email: { in: demoUsers.map((u) => u.email) } },
      ],
    },
  });
  assert.equal(
    occupied + users,
    0,
    "Demo namespace must be empty in the isolated test database; existing demo data will not be removed.",
  );
  ownsNamespace = true;
});

async function cleanupDemo() {
  await prisma.$transaction(async (tx) => {
    const where = { barbershopId: demoShopId };
    await tx.customerReminder.deleteMany({ where });
    await tx.blockedPeriod.deleteMany({ where });
    await tx.businessHour.deleteMany({ where });
    await tx.appointment.deleteMany({ where });
    await tx.service.deleteMany({ where });
    await tx.customer.deleteMany({ where });
    await tx.barber.deleteMany({ where });
    await tx.barbershopMember.deleteMany({ where });
    await tx.barbershop.deleteMany({ where: { id: demoShopId } });
    await tx.user.deleteMany({
      where: { id: { in: demoUsers.map((u) => u.id) } },
    });
  });
}

after(async () => {
  try {
    if (ownsNamespace) await cleanupDemo();
    await prisma.customer.deleteMany({ where: { barbershopId: otherShopId } });
    await prisma.barbershop.deleteMany({ where: { id: otherShopId } });
    await prisma.user.deleteMany({ where: { id: otherUserId } });
  } finally {
    await prisma.$disconnect();
  }
});

async function snapshot() {
  const where = { barbershopId: demoShopId };
  const orderBy = { id: "asc" as const };
  return Promise.all([
    prisma.user.findMany({
      where: { id: { in: demoUsers.map((u) => u.id) } },
      orderBy,
    }),
    prisma.barbershop.findMany({ where: { id: demoShopId }, orderBy }),
    prisma.barbershopMember.findMany({ where, orderBy: { userId: "asc" } }),
    prisma.barber.findMany({ where, orderBy }),
    prisma.customer.findMany({ where, orderBy }),
    prisma.service.findMany({ where, orderBy }),
    prisma.appointment.findMany({ where, orderBy }),
    prisma.businessHour.findMany({ where, orderBy }),
    prisma.blockedPeriod.findMany({ where, orderBy }),
    prisma.customerReminder.findMany({ where, orderBy }),
  ]);
}

test("production seed CLI exits before touching the database and without revealing credentials", () => {
  const result = spawnSync(
    process.execPath,
    ["--import", "tsx", "--conditions=react-server", "prisma/seed.ts"],
    {
      env: {
        ...process.env,
        NODE_ENV: "production",
        DATABASE_URL: "postgresql://example:DO_NOT_LOG@127.0.0.1:1/unreachable",
      },
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /disabled in production/);
  assert.ok(!(result.stdout + result.stderr).includes("DO_NOT_LOG"));
});

test("demo seed produces all ten models and all appointment states; repetition leaves every row unchanged", async () => {
  assert.equal(await seedDemo(prisma), 36);
  const first = await snapshot();
  assert.deepEqual(
    first.map((rows) => rows.length),
    [3, 1, 3, 2, 4, 3, 5, 12, 2, 1],
  );
  assert.equal(await seedDemo(prisma), 36);
  assert.deepEqual(await snapshot(), first);
  const appointments = await prisma.appointment.findMany({
    where: { barbershopId: demoShopId },
  });
  assert.deepEqual(
    new Set(appointments.map((a) => a.status)),
    new Set(["SCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
  );
  assert.equal(
    await prisma.customer.count({
      where: { barbershopId: demoShopId, whatsappConsent: true },
    }),
    0,
  );
});

test("repeated and concurrent seeds preserve edited demo records and historical service snapshots", async () => {
  await prisma.service.update({
    where: { id: demoServices[0].id },
    data: { name: "Edited demo", priceCents: 6500 },
  });
  await prisma.customer.update({
    where: { id: demoCustomers[0].id },
    data: { name: "Edited customer" },
  });
  await prisma.appointment.update({
    where: { id: demoAppointments[0].id },
    data: { status: "CANCELLED" },
  });
  await prisma.customerReminder.update({
    where: { id: demoReminders[0].id },
    data: { status: "DISMISSED" },
  });
  const edited = await snapshot();
  assert.deepEqual(
    await Promise.all([seedDemo(prisma), seedDemo(prisma)]),
    [36, 36],
  );
  assert.deepEqual(await snapshot(), edited);
  const historical = await prisma.appointment.findUniqueOrThrow({
    where: { id: demoAppointments[4].id },
  });
  assert.equal(historical.servicePriceCents, 5000);
});

test("unrelated users and shops remain untouched", async () => {
  await prisma.user.create({
    data: {
      id: otherUserId,
      name: "Unrelated fixture",
      email: `${otherUserId}@example.invalid`,
    },
  });
  await prisma.barbershop.create({
    data: {
      id: otherShopId,
      name: "Unrelated fixture",
      slug: `fixture-${otherShopId}`,
    },
  });
  await prisma.customer.create({
    data: {
      id: otherCustomerId,
      barbershopId: otherShopId,
      name: "Unrelated fixture",
      phone: demoCustomers[0].phone,
    },
  });
  const before = await Promise.all([
    prisma.user.findUnique({ where: { id: otherUserId } }),
    prisma.barbershop.findUnique({ where: { id: otherShopId } }),
    prisma.customer.findUnique({ where: { id: otherCustomerId } }),
  ]);
  await seedDemo(prisma);
  assert.deepEqual(
    await Promise.all([
      prisma.user.findUnique({ where: { id: otherUserId } }),
      prisma.barbershop.findUnique({ where: { id: otherShopId } }),
      prisma.customer.findUnique({ where: { id: otherCustomerId } }),
    ]),
    before,
  );
});

test("a fixed demo ID owned by another shop aborts without creating or modifying records", async () => {
  await cleanupDemo();
  await prisma.customer.create({
    data: {
      id: demoCustomers[0].id,
      barbershopId: otherShopId,
      name: "Collision fixture",
      phone: "+12025550109",
    },
  });
  const existing = await prisma.customer.findUnique({
    where: { id: demoCustomers[0].id },
  });
  await assert.rejects(seedDemo(prisma), DemoSeedError);
  assert.deepEqual(
    await prisma.customer.findUnique({ where: { id: demoCustomers[0].id } }),
    existing,
  );
  assert.equal(
    await prisma.user.count({
      where: { id: { in: demoUsers.map((u) => u.id) } },
    }),
    0,
  );
  await prisma.customer.delete({ where: { id: demoCustomers[0].id } });
});

test("slug collision rolls back even users created before the conflicting shop insert", async () => {
  await prisma.barbershop.update({
    where: { id: otherShopId },
    data: { slug: demoSlug },
  });
  const existing = await prisma.barbershop.findUnique({
    where: { id: otherShopId },
  });
  await assert.rejects(seedDemo(prisma));
  assert.deepEqual(
    await prisma.barbershop.findUnique({ where: { id: otherShopId } }),
    existing,
  );
  assert.equal(
    await prisma.user.count({
      where: { id: { in: demoUsers.map((u) => u.id) } },
    }),
    0,
  );
  assert.equal(await prisma.barbershop.count({ where: { id: demoShopId } }), 0);
  await prisma.barbershop.update({
    where: { id: otherShopId },
    data: { slug: `fixture-${otherShopId}` },
  });
});

test("an excluded appointment does not cause silent success or leave newly inserted reminders behind", async () => {
  await seedDemo(prisma);
  await prisma.appointment.delete({ where: { id: demoAppointments[0].id } });
  await prisma.customerReminder.delete({ where: { id: demoReminders[0].id } });
  const blocker = await prisma.appointment.create({
    data: {
      barbershopId: demoShopId,
      barberId: demoBarbers[0].id,
      customerId: demoCustomers[0].id,
      serviceId: demoServices[0].id,
      startsAt: demoAppointments[0].startsAt,
      endsAt: demoAppointments[0].endsAt,
      serviceName: "Manual demo fixture",
      servicePriceCents: 5000,
      serviceDurationMinutes: 30,
    },
  });
  await assert.rejects(seedDemo(prisma), DemoSeedError);
  assert.deepEqual(
    await prisma.appointment.findUnique({ where: { id: blocker.id } }),
    blocker,
  );
  assert.equal(
    await prisma.appointment.count({ where: { id: demoAppointments[0].id } }),
    0,
  );
  assert.equal(
    await prisma.customerReminder.count({ where: { id: demoReminders[0].id } }),
    0,
  );
});
