export class DemoSeedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoSeedError";
  }
}

export function assertDemoSeedAllowed(environment = process.env.NODE_ENV) {
  if (environment === "production") {
    throw new DemoSeedError(
      "Demo seed is disabled in production. / Seed demo desativado em produção.",
    );
  }
}
