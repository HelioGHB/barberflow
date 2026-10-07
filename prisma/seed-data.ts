import type { Prisma } from "../src/generated/prisma/client";

function id(number: number) {
  return `bf000004-0000-4000-8000-${number.toString(16).padStart(12, "0")}`;
}

export const demoShopId = id(1);
export const demoSlug = "barberflow-demo";
export const demoUsers = [
  {
    id: id(101),
    name: "Proprietário fictício",
    email: "owner@barberflow.example.invalid",
  },
  {
    id: id(102),
    name: "Administrador fictício",
    email: "admin@barberflow.example.invalid",
  },
  {
    id: id(103),
    name: "Barbeiro fictício",
    email: "barber@barberflow.example.invalid",
  },
] satisfies Prisma.UserCreateManyInput[];

export const demoMembers = demoUsers.map((user, index) => ({
  barbershopId: demoShopId,
  userId: user.id,
  role: (["OWNER", "ADMIN", "BARBER"] as const)[index],
}));
export const demoBarbers = [
  {
    id: id(201),
    barbershopId: demoShopId,
    userId: demoUsers[0].id,
    displayName: "Barbeiro demo A",
  },
  {
    id: id(202),
    barbershopId: demoShopId,
    userId: demoUsers[2].id,
    displayName: "Barbeiro demo B",
  },
] satisfies Prisma.BarberCreateManyInput[];
export const demoCustomers = ["Alex", "Bia", "Caio", "Dani"].map(
  (name, index) => ({
    id: id(301 + index),
    barbershopId: demoShopId,
    name: `${name} — cliente fictício`,
    // NANPA reserves 555-0100 through 555-0199 for fictitious, non-working numbers.
    phone: `+1202555010${index + 1}`,
    whatsappConsent: false,
  }),
);
export const demoServices = [
  {
    id: id(401),
    barbershopId: demoShopId,
    name: "Corte demo",
    priceCents: 5000,
    durationMinutes: 30,
  },
  {
    id: id(402),
    barbershopId: demoShopId,
    name: "Barba demo",
    priceCents: 3500,
    durationMinutes: 20,
  },
  {
    id: id(403),
    barbershopId: demoShopId,
    name: "Corte e barba demo",
    priceCents: 8000,
    durationMinutes: 50,
  },
] satisfies Prisma.ServiceCreateManyInput[];
const scenarios = [
  {
    start: "2026-10-08T13:00:00Z",
    status: "SCHEDULED",
    customer: 0,
    barber: 0,
    service: 0,
  },
  {
    start: "2026-09-30T13:00:00Z",
    status: "COMPLETED",
    customer: 1,
    barber: 1,
    service: 2,
  },
  {
    start: "2026-10-08T13:30:00Z",
    status: "CANCELLED",
    customer: 1,
    barber: 0,
    service: 1,
  },
  {
    start: "2026-10-01T14:00:00Z",
    status: "NO_SHOW",
    customer: 2,
    barber: 1,
    service: 0,
  },
  {
    start: "2026-08-20T13:00:00Z",
    status: "COMPLETED",
    customer: 3,
    barber: 0,
    service: 0,
  },
] as const;
export const demoAppointments = scenarios.map((scenario, index) => {
  const service = demoServices[scenario.service];
  const startsAt = new Date(scenario.start);
  const endsAt = new Date(
    startsAt.getTime() + service.durationMinutes * 60_000,
  );
  return {
    id: id(501 + index),
    barbershopId: demoShopId,
    barberId: demoBarbers[scenario.barber].id,
    customerId: demoCustomers[scenario.customer].id,
    serviceId: service.id,
    startsAt,
    endsAt,
    status: scenario.status,
    serviceName: service.name,
    servicePriceCents: service.priceCents,
    serviceDurationMinutes: service.durationMinutes,
    completedAt: scenario.status === "COMPLETED" ? endsAt : null,
    notes: "Demonstração fictícia / Fictitious demo",
  };
});
export const demoHours = Array.from(
  { length: 6 },
  (_, index) => index + 1,
).flatMap((weekday) =>
  [
    [540, 720],
    [840, 1080],
  ].map(([startMinute, endMinute], shift) => ({
    id: id(601 + (weekday - 1) * 2 + shift),
    barbershopId: demoShopId,
    weekday,
    startMinute,
    endMinute,
  })),
);
export const demoBlocks = [
  {
    id: id(701),
    barbershopId: demoShopId,
    barberId: null,
    startsAt: new Date("2026-10-08T17:00:00Z"),
    endsAt: new Date("2026-10-08T18:00:00Z"),
    reason: "Fechamento fictício / Fictitious closure",
  },
  {
    id: id(702),
    barbershopId: demoShopId,
    barberId: demoBarbers[1].id,
    startsAt: new Date("2026-10-08T18:00:00Z"),
    endsAt: new Date("2026-10-08T18:30:00Z"),
    reason: "Pausa fictícia / Fictitious break",
  },
] satisfies Prisma.BlockedPeriodCreateManyInput[];
export const demoReminders = [
  {
    id: id(801),
    barbershopId: demoShopId,
    customerId: demoCustomers[3].id,
    status: "PENDING" as const,
  },
];
