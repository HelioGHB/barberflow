import { spawnSync } from "node:child_process";
import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const testUrl = process.env.TEST_DATABASE_URL;
const appUrl = process.env.DATABASE_URL;

try {
  if (!testUrl) throw new Error("TEST_DATABASE_URL is required.");
  const target = new URL(testUrl);
  if (
    !["postgres:", "postgresql:"].includes(target.protocol) ||
    target.pathname.length < 2
  ) {
    throw new Error("TEST_DATABASE_URL must be a PostgreSQL URL.");
  }
  // Reject the same database name even when a hostname alias or schema differs.
  if (
    appUrl &&
    decodeURIComponent(new URL(appUrl).pathname) ===
      decodeURIComponent(target.pathname)
  ) {
    throw new Error(
      "Use a separate test database, never the application database.",
    );
  }
} catch {
  console.error(
    "Configure TEST_DATABASE_URL for a separate PostgreSQL test database. / Configure TEST_DATABASE_URL para um banco PostgreSQL de testes separado.",
  );
  process.exit(1);
}

const env = { ...process.env, DATABASE_URL: testUrl };
const commands = [
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  [
    "node_modules/prisma/build/index.js",
    "migrate",
    "diff",
    "--from-config-datasource",
    "--to-schema",
    "prisma/schema.prisma",
    "--exit-code",
  ],
  [
    "--import",
    "tsx",
    "--conditions=react-server",
    "--test",
    "tests/integration/schema.test.ts",
  ],
];

for (const args of commands) {
  const result = spawnSync(process.execPath, args, { env, stdio: "inherit" });
  if (result.error || result.status !== 0) process.exit(result.status ?? 1);
}
