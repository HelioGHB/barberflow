import nextEnv from "@next/env";
import { defineConfig } from "prisma/config";

nextEnv.loadEnvConfig(process.cwd());

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  // Generation and validation do not need a live database or credentials.
  datasource: { url: process.env.DATABASE_URL },
});
