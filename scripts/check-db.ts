import nextEnv from "@next/env";
import { createPrismaClient } from "../src/lib/prisma-client";

nextEnv.loadEnvConfig(process.cwd());

let client: ReturnType<typeof createPrismaClient> | undefined;
try {
  client = createPrismaClient();
  const rows = await client.$queryRaw<{ ok: number }[]>`SELECT 1::int AS ok`;
  if (rows.length !== 1 || rows[0].ok !== 1)
    throw new Error("Unexpected database response.");
  console.log("PostgreSQL connection OK / Conexão PostgreSQL OK.");
} catch {
  // Do not print driver errors: they can contain connection credentials.
  console.error(
    "Database check failed. Verify DATABASE_URL and PostgreSQL availability. / Falha na conexão. Verifique DATABASE_URL e PostgreSQL.",
  );
  process.exitCode = 1;
} finally {
  await client?.$disconnect();
}
