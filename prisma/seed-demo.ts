import "server-only";
import type { PrismaClient } from "../src/generated/prisma/client";
import { assertDemoSeedAllowed, DemoSeedError } from "./seed-environment";
import {
  demoShopId,
  demoSlug,
  demoUsers,
  demoMembers,
  demoBarbers,
  demoCustomers,
  demoServices,
  demoAppointments,
  demoHours,
  demoBlocks,
  demoReminders,
} from "./seed-data";

export async function seedDemo(prisma: PrismaClient) {
  assertDemoSeedAllowed();
  return prisma.$transaction(
    async (tx) => {
      // Serialize repeated demo seeds; no table deletion, reset or update is needed.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(42004)`;
      const collision = () =>
        new DemoSeedError(
          "Demo identity collision; no changes committed. / Colisão de identidade demo; nenhuma alteração aplicada.",
        );
      const shop = await tx.barbershop.findUnique({
        where: { id: demoShopId },
      });
      if (shop && shop.slug !== demoSlug) throw collision();
      const users = await tx.user.findMany({
        where: { id: { in: demoUsers.map((row) => row.id) } },
      });
      if (
        users.some(
          (row) =>
            row.email !==
            demoUsers.find((expected) => expected.id === row.id)?.email,
        )
      )
        throw collision();

      // Existing fixed IDs must not belong to another shop.
      const existing = await Promise.all([
        tx.barber.findMany({
          where: { id: { in: demoBarbers.map((row) => row.id) } },
          select: { barbershopId: true },
        }),
        tx.customer.findMany({
          where: { id: { in: demoCustomers.map((row) => row.id) } },
          select: { barbershopId: true },
        }),
        tx.service.findMany({
          where: { id: { in: demoServices.map((row) => row.id) } },
          select: { barbershopId: true },
        }),
        tx.appointment.findMany({
          where: { id: { in: demoAppointments.map((row) => row.id) } },
          select: { barbershopId: true },
        }),
        tx.businessHour.findMany({
          where: { id: { in: demoHours.map((row) => row.id) } },
          select: { barbershopId: true },
        }),
        tx.blockedPeriod.findMany({
          where: { id: { in: demoBlocks.map((row) => row.id) } },
          select: { barbershopId: true },
        }),
        tx.customerReminder.findMany({
          where: { id: { in: demoReminders.map((row) => row.id) } },
          select: { barbershopId: true },
        }),
      ]);
      if (existing.flat().some((row) => row.barbershopId !== demoShopId))
        throw collision();

      await tx.user.createMany({ data: demoUsers, skipDuplicates: true });
      await tx.barbershop.createMany({
        data: [
          {
            id: demoShopId,
            name: "BarberFlow Demo — Fictícia",
            slug: demoSlug,
            timezone: "America/Sao_Paulo",
          },
        ],
        skipDuplicates: true,
      });
      await tx.barbershopMember.createMany({
        data: demoMembers,
        skipDuplicates: true,
      });
      await tx.barber.createMany({ data: demoBarbers, skipDuplicates: true });
      await tx.customer.createMany({
        data: demoCustomers,
        skipDuplicates: true,
      });
      await tx.service.createMany({ data: demoServices, skipDuplicates: true });
      await tx.businessHour.createMany({
        data: demoHours,
        skipDuplicates: true,
      });
      await tx.appointment.createMany({
        data: demoAppointments,
        skipDuplicates: true,
      });
      await tx.blockedPeriod.createMany({
        data: demoBlocks,
        skipDuplicates: true,
      });
      await tx.customerReminder.createMany({
        data: demoReminders,
        skipDuplicates: true,
      });

      // Unique/exclusion conflicts may be skipped: never report success with missing fixtures.
      const counts = await Promise.all([
        tx.user.count({
          where: { id: { in: demoUsers.map((row) => row.id) } },
        }),
        tx.barbershop.count({ where: { id: demoShopId } }),
        tx.barbershopMember.count({
          where: {
            barbershopId: demoShopId,
            userId: { in: demoUsers.map((row) => row.id) },
          },
        }),
        tx.barber.count({
          where: { id: { in: demoBarbers.map((row) => row.id) } },
        }),
        tx.customer.count({
          where: { id: { in: demoCustomers.map((row) => row.id) } },
        }),
        tx.service.count({
          where: { id: { in: demoServices.map((row) => row.id) } },
        }),
        tx.appointment.count({
          where: { id: { in: demoAppointments.map((row) => row.id) } },
        }),
        tx.businessHour.count({
          where: { id: { in: demoHours.map((row) => row.id) } },
        }),
        tx.blockedPeriod.count({
          where: { id: { in: demoBlocks.map((row) => row.id) } },
        }),
        tx.customerReminder.count({
          where: { id: { in: demoReminders.map((row) => row.id) } },
        }),
      ]);
      const expected = [3, 1, 3, 2, 4, 3, 5, 12, 2, 1];
      if (counts.some((count, index) => count !== expected[index]))
        throw collision();
      return counts.reduce((sum, count) => sum + count, 0);
    },
    { timeout: 15_000 },
  );
}
