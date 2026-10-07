-- Initial schema / Schema inicial. Apply atomically; never edit after deployment.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('OWNER', 'ADMIN', 'BARBER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('PENDING', 'CONTACTED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Barbershop" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "timezone" VARCHAR(100) NOT NULL DEFAULT 'America/Sao_Paulo',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Barbershop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarbershopMember" (
    "barbershopId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BarbershopMember_pkey" PRIMARY KEY ("barbershopId","userId")
);

-- CreateTable
CREATE TABLE "Barber" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barbershopId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayName" VARCHAR(120) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Barber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barbershopId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(16) NOT NULL,
    "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barbershopId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barbershopId" UUID NOT NULL,
    "barberId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "serviceId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "serviceName" VARCHAR(120) NOT NULL,
    "servicePriceCents" INTEGER NOT NULL,
    "serviceDurationMinutes" INTEGER NOT NULL,
    "completedAt" TIMESTAMPTZ(3),
    "notes" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessHour" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barbershopId" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BusinessHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedPeriod" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barbershopId" UUID NOT NULL,
    "barberId" UUID,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "reason" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "BlockedPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerReminder" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "barbershopId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "status" "ReminderStatus" NOT NULL DEFAULT 'PENDING',
    "contactedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CustomerReminder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Barbershop_slug_key" ON "Barbershop"("slug");

-- CreateIndex
CREATE INDEX "BarbershopMember_userId_isActive_idx" ON "BarbershopMember"("userId", "isActive");

-- CreateIndex
CREATE INDEX "BarbershopMember_barbershopId_role_isActive_idx" ON "BarbershopMember"("barbershopId", "role", "isActive");

-- CreateIndex
CREATE INDEX "Barber_barbershopId_isActive_idx" ON "Barber"("barbershopId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Barber_barbershopId_id_key" ON "Barber"("barbershopId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Barber_barbershopId_userId_key" ON "Barber"("barbershopId", "userId");

-- CreateIndex
CREATE INDEX "Customer_barbershopId_isActive_name_idx" ON "Customer"("barbershopId", "isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_barbershopId_id_key" ON "Customer"("barbershopId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_barbershopId_phone_key" ON "Customer"("barbershopId", "phone");

-- CreateIndex
CREATE INDEX "Service_barbershopId_isActive_name_idx" ON "Service"("barbershopId", "isActive", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Service_barbershopId_id_key" ON "Service"("barbershopId", "id");

-- CreateIndex
CREATE INDEX "Appointment_barbershopId_barberId_startsAt_idx" ON "Appointment"("barbershopId", "barberId", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_barbershopId_startsAt_status_idx" ON "Appointment"("barbershopId", "startsAt", "status");

-- CreateIndex
CREATE INDEX "Appointment_barbershopId_customerId_status_startsAt_idx" ON "Appointment"("barbershopId", "customerId", "status", "startsAt");

-- CreateIndex
CREATE INDEX "Appointment_barbershopId_serviceId_idx" ON "Appointment"("barbershopId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_barbershopId_id_key" ON "Appointment"("barbershopId", "id");

-- CreateIndex
CREATE INDEX "BusinessHour_barbershopId_weekday_startMinute_idx" ON "BusinessHour"("barbershopId", "weekday", "startMinute");

-- CreateIndex
CREATE INDEX "BlockedPeriod_barbershopId_startsAt_idx" ON "BlockedPeriod"("barbershopId", "startsAt");

-- CreateIndex
CREATE INDEX "BlockedPeriod_barbershopId_barberId_startsAt_idx" ON "BlockedPeriod"("barbershopId", "barberId", "startsAt");

-- CreateIndex
CREATE INDEX "CustomerReminder_barbershopId_status_createdAt_idx" ON "CustomerReminder"("barbershopId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerReminder_barbershopId_customerId_createdAt_idx" ON "CustomerReminder"("barbershopId", "customerId", "createdAt");

-- AddForeignKey
ALTER TABLE "BarbershopMember" ADD CONSTRAINT "BarbershopMember_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "BarbershopMember" ADD CONSTRAINT "BarbershopMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Barber" ADD CONSTRAINT "Barber_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Barber" ADD CONSTRAINT "Barber_barbershopId_userId_fkey" FOREIGN KEY ("barbershopId", "userId") REFERENCES "BarbershopMember"("barbershopId", "userId") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_barbershopId_barberId_fkey" FOREIGN KEY ("barbershopId", "barberId") REFERENCES "Barber"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_barbershopId_customerId_fkey" FOREIGN KEY ("barbershopId", "customerId") REFERENCES "Customer"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_barbershopId_serviceId_fkey" FOREIGN KEY ("barbershopId", "serviceId") REFERENCES "Service"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "BlockedPeriod" ADD CONSTRAINT "BlockedPeriod_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "BlockedPeriod" ADD CONSTRAINT "BlockedPeriod_barbershopId_barberId_fkey" FOREIGN KEY ("barbershopId", "barberId") REFERENCES "Barber"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CustomerReminder" ADD CONSTRAINT "CustomerReminder_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "Barbershop"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "CustomerReminder" ADD CONSTRAINT "CustomerReminder_barbershopId_customerId_fkey" FOREIGN KEY ("barbershopId", "customerId") REFERENCES "Customer"("barbershopId", "id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- PostgreSQL constraints not expressible in Prisma Schema Language.
CREATE FUNCTION "public"."is_valid_timezone"(zone TEXT) RETURNS BOOLEAN
LANGUAGE sql STABLE SET search_path = pg_catalog
AS $$ SELECT EXISTS (SELECT 1 FROM pg_timezone_names WHERE name = zone) $$;

ALTER TABLE "User"
  ADD CONSTRAINT "User_name_not_blank" CHECK (length(btrim("name")) > 0),
  ADD CONSTRAINT "User_email_normalized" CHECK ("email" = lower(btrim("email")) AND "email" ~ '^[^[:space:]@]+@[^[:space:]@]+$');
ALTER TABLE "Barbershop"
  ADD CONSTRAINT "Barbershop_name_not_blank" CHECK (length(btrim("name")) > 0),
  ADD CONSTRAINT "Barbershop_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ADD CONSTRAINT "Barbershop_timezone_valid" CHECK ("public"."is_valid_timezone"("timezone"));
ALTER TABLE "Barber"
  ADD CONSTRAINT "Barber_name_not_blank" CHECK (length(btrim("displayName")) > 0);
ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_name_not_blank" CHECK (length(btrim("name")) > 0),
  ADD CONSTRAINT "Customer_phone_e164" CHECK ("phone" ~ '^\+[1-9][0-9]{7,14}$');
ALTER TABLE "Service"
  ADD CONSTRAINT "Service_name_not_blank" CHECK (length(btrim("name")) > 0),
  ADD CONSTRAINT "Service_price_nonnegative" CHECK ("priceCents" >= 0),
  ADD CONSTRAINT "Service_duration_positive" CHECK ("durationMinutes" > 0);
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_interval_valid" CHECK (isfinite("startsAt") AND isfinite("endsAt") AND "startsAt" < "endsAt"),
  ADD CONSTRAINT "Appointment_snapshot_valid" CHECK (length(btrim("serviceName")) > 0 AND "servicePriceCents" >= 0 AND "serviceDurationMinutes" > 0),
  ADD CONSTRAINT "Appointment_duration_matches" CHECK ("endsAt" = "startsAt" + "serviceDurationMinutes" * INTERVAL '1 minute'),
  ADD CONSTRAINT "Appointment_completion_valid" CHECK (("status" = 'COMPLETED') = ("completedAt" IS NOT NULL) AND ("completedAt" IS NULL OR isfinite("completedAt")));
ALTER TABLE "BusinessHour"
  ADD CONSTRAINT "BusinessHour_weekday_valid" CHECK ("weekday" BETWEEN 0 AND 6),
  ADD CONSTRAINT "BusinessHour_interval_valid" CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");
ALTER TABLE "BlockedPeriod"
  ADD CONSTRAINT "BlockedPeriod_interval_valid" CHECK (isfinite("startsAt") AND isfinite("endsAt") AND "startsAt" < "endsAt");
ALTER TABLE "CustomerReminder"
  ADD CONSTRAINT "CustomerReminder_contact_valid" CHECK (("status" = 'CONTACTED') = ("contactedAt" IS NOT NULL) AND ("contactedAt" IS NULL OR isfinite("contactedAt")));

-- [start, end) permits adjacent reservations and rejects concurrent overlap.
-- Only cancellation releases the historical reserved interval.
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_no_overlap"
  EXCLUDE USING gist (
    "barbershopId" WITH =,
    "barberId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  ) WHERE ("status" <> 'CANCELLED');
ALTER TABLE "BusinessHour" ADD CONSTRAINT "BusinessHour_no_overlap"
  EXCLUDE USING gist (
    "barbershopId" WITH =,
    "weekday" WITH =,
    int4range("startMinute", "endMinute", '[)') WITH &&
  );

COMMIT;
