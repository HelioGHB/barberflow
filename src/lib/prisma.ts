import "server-only";
import type { PrismaClient } from "../generated/prisma/client";
import { createPrismaClient } from "./prisma-client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
let client: PrismaClient | undefined;

// Resolve lazily so static builds do not require database credentials.
export function getPrisma(): PrismaClient {
  if (client) return client;
  client = globalForPrisma.prisma ?? createPrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}
