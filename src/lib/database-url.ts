export function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error(
      "DATABASE_URL is required. Copy .env.example to .env and configure PostgreSQL.",
    );
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL URL.");
  }

  if (
    !["postgresql:", "postgres:"].includes(url.protocol) ||
    !url.hostname ||
    url.pathname.length < 2
  ) {
    throw new Error(
      "DATABASE_URL must use postgresql:// or postgres:// and include a host and database name.",
    );
  }

  return value;
}
