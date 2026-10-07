import nextEnv from "@next/env";
import { createPrismaClient } from "../src/lib/prisma-client";
import { seedDemo } from "./seed-demo";
import { assertDemoSeedAllowed, DemoSeedError } from "./seed-environment";

nextEnv.loadEnvConfig(process.cwd());
let prisma: ReturnType<typeof createPrismaClient> | undefined;
try {
  assertDemoSeedAllowed();
  prisma = createPrismaClient();
  const count = await seedDemo(prisma);
  console.log(
    `Demo seed ready: ${count} records / Seed demo pronto: ${count} registros. No messages sent / Nenhuma mensagem enviada.`,
  );
} catch (error) {
  console.error(
    error instanceof DemoSeedError
      ? error.message
      : "Demo seed failed. Check database, migrations and demo identity conflicts. / Falha no seed demo. Verifique banco, migrations e conflitos de identidade.",
  );
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
