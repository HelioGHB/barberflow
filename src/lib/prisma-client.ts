import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { getDatabaseUrl } from "./database-url";

export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
    max: 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  return new PrismaClient({ adapter, log: [] });
}
