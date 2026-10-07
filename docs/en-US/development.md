# Development

[Português (Brasil)](../pt-BR/development.md)

## Environment and commands

Node.js 24 and npm; `.nvmrc` and `engines` specify the supported version. `npm ci` uses the lockfile and generates Prisma Client through `postinstall`. Generation and builds need neither credentials nor a running database. For connections, create `.env` from `.env.example`. Docker Compose v2 is optional when using external PostgreSQL.

| Command                                     | Purpose                                     |
| ------------------------------------------- | ------------------------------------------- |
| `npm run dev`                               | Local server with Webpack                   |
| `npm run check`                             | Lint, TypeScript and formatting             |
| `npm run lint`                              | ESLint without warnings                     |
| `npm run typecheck`                         | Generate Prisma/route types and check types |
| `npm run format` / `npm run format:check`   | Format / verify                             |
| `npm test`                                  | Database URL configuration tests            |
| `npm run build` / `npm run start`           | Build / serve production                    |
| `npm run db:up` / `npm run db:down`         | Start / stop local PostgreSQL               |
| `npm run db:generate`                       | Generate Prisma Client                      |
| `npm run db:validate` / `npm run db:format` | Validate / format schema                    |
| `npm run db:check`                          | `SELECT 1` integration diagnostic           |
| `npm run db:studio`                         | Inspect local database once models exist    |

BF-002 has no migrations or seeds. Prisma Studio becomes useful after BF-003. The model-free schema generates a client that checks connectivity without introducing business entities.

## GitHub and languages

Provided remote: `https://github.com/HelioGHB/barberflow.git`. Main branch: `main`. The default README is English, `README.pt-BR.md` is Portuguese; corresponding documents live in `docs/en-US` and `docs/pt-BR`. Update both versions in the same task. Issue and PR templates are bilingual. The product UI remains pt-BR.

`.github/workflows/ci.yml` runs quality checks and a build without database configuration in the first job; a separate job checks the connection against temporary PostgreSQL using fictitious credentials. No actual project credentials are needed. The workflow was prepared locally; verify its remote result in GitHub Actions after pushing.

Prefer small semantic commits. `.env*`, generated Prisma code, node_modules and `.next` stay out of Git; `.env.example` is allowed. Do not embed tokens in the `origin` URL. For an existing clone, use `git push -u origin main` with configured GitHub authentication. Do not use force pushes to resolve conflicts.

## Tests and compiler

BF-002 uses Node's native test runner through `tsx`, avoiding another framework for configuration tests. It checks accepted URLs, missing variables, invalid protocols and messages without secret values. The integration diagnostic runs `SELECT 1` against real PostgreSQL. Vitest and Playwright remain planned for the first business rules and user flows.

Scripts use the supported `--webpack` option and Tailwind/PostCSS plugin. The original Turbopack template failed in BF-001 when opening an internal CSS-processing port in this environment. The product stack was preserved.

## Known dependency findings

BF-001's audit reported five high findings in the ESLint chain (`braces`, GHSA-vfj7-8cjw-p6xm). ESLint 9.39.5 stays for compatibility with official plugins despite npm reporting end of maintenance. Trying ESLint 10 revealed incompatible peers.

BF-002 added transitive Prisma CLI findings for `deepmerge-ts` (GHSA-ggr8-5vv4-36mx) and `mysql2` (GHSA-3f6p-5ww8-9rcr / GHSA-rgwj-5xj2-c3m3). The full audit reported nine high findings; `--omit=dev` also lists four Prisma-chain findings because `@prisma/client` has a peer relationship with the CLI. This does not mean the application uses MySQL, but the installed dependency finding remains.

`npm audit fix` without `--force` was executed; remaining suggestions require incompatible major downgrades of Prisma and eslint-config-next. Do not apply them automatically. Before deployment, reassess patched versions and dependencies actually included in the production artifact. BF-002 does not claim a clean audit.
