import assert from "node:assert/strict";
import { test } from "node:test";
import { getDatabaseUrl } from "../src/lib/database-url";

test("database configuration accepts PostgreSQL URLs and rejects invalid values without exposing credentials", () => {
  const original = process.env.DATABASE_URL;
  try {
    for (const value of [
      "postgresql://user:example@localhost:5433/barberflow",
      "postgres://user:example@localhost/barberflow",
    ]) {
      process.env.DATABASE_URL = value;
      assert.equal(getDatabaseUrl(), value);
    }
    delete process.env.DATABASE_URL;
    assert.throws(getDatabaseUrl, /DATABASE_URL is required/);
    for (const value of [
      "",
      "malformed:secret",
      "https://user:secret@localhost/db",
      "postgresql://localhost",
      "postgresql:///db",
    ]) {
      process.env.DATABASE_URL = value;
      assert.throws(getDatabaseUrl, (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.match(error.message, /DATABASE_URL/);
        assert.ok(!error.message.includes("secret"));
        return true;
      });
    }
  } finally {
    if (original === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original;
  }
});
