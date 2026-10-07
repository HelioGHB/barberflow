# Contributing / Contribuição

## English (US)

Work on a small, scoped task and describe the resulting behavior in your pull request. Run `npm run check`, `npm test`, `npm run db:validate` and `npm run build`. Changes to database access also require `npm run db:check` and `npm run db:test` against separate local application/test databases. Update `docs/en-US` and `docs/pt-BR` together.

Use semantic commits such as `feat:`, `fix:`, `test:`, `docs:` and `chore:`. Keep generated code, build output and credentials out of Git. Business migrations are versioned from BF-003; never reset or overwrite an existing database as part of a routine setup task. Product translations require a separately scoped task.

## Português (Brasil)

Trabalhe em uma tarefa pequena com escopo definido e descreva o comportamento resultante no pull request. Execute `npm run check`, `npm test`, `npm run db:validate` e `npm run build`. Mudanças no acesso ao banco também exigem `npm run db:check` e `npm run db:test` com bancos locais separados para aplicação/testes. Atualize `docs/en-US` e `docs/pt-BR` juntos.

Use commits semânticos como `feat:`, `fix:`, `test:`, `docs:` e `chore:`. Não versionar código gerado, artefatos ou credenciais. Migrations de negócio são versionadas desde BF-003; nunca resetar ou sobrescrever um banco existente durante configuração rotineira. Traduções do produto exigem uma tarefa própria.
