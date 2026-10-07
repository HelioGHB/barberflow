# Desenvolvimento

[English (US)](../en-US/development.md)

## Ambiente e comandos

Node.js 24 e npm; `.nvmrc` e `engines` indicam a versão suportada. `npm ci` usa o lockfile e gera Prisma Client via `postinstall`. A geração e o build não dependem de credenciais ou banco ativo. Para conectar, configure `.env` a partir de `.env.example`. Docker Compose v2 é opcional se usar PostgreSQL externo.

| Comando                                     | Finalidade                                    |
| ------------------------------------------- | --------------------------------------------- |
| `npm run dev`                               | Servidor local com Webpack                    |
| `npm run check`                             | Lint, TypeScript e formatação                 |
| `npm run lint`                              | ESLint sem warnings                           |
| `npm run typecheck`                         | Gera Prisma/rotas e verifica tipos            |
| `npm run format` / `npm run format:check`   | Formatar / verificar                          |
| `npm test`                                  | Testes da configuração da URL                 |
| `npm run build` / `npm run start`           | Compilar / servir produção                    |
| `npm run db:up` / `npm run db:down`         | Iniciar / parar PostgreSQL local              |
| `npm run db:generate`                       | Gerar cliente Prisma                          |
| `npm run db:validate` / `npm run db:format` | Validar / formatar schema                     |
| `npm run db:check`                          | Consulta de integração `SELECT 1`             |
| `npm run db:studio`                         | Inspecionar banco local quando houver modelos |

Não há migrations ou seed na BF-002. Prisma Studio será útil após BF-003. O schema sem modelos gera um cliente que permite consultar a conexão sem antecipar entidades.

## GitHub e idiomas

Remoto informado: `https://github.com/HelioGHB/barberflow.git`. Branch principal: `main`. README principal em inglês, `README.pt-BR.md` em português; documentos correspondentes em `docs/en-US` e `docs/pt-BR`. Atualize ambas as versões na mesma tarefa. Templates de issue e PR são bilíngues. A interface permanece em pt-BR.

A rotina `.github/workflows/ci.yml` executa qualidade e build sem configurar banco no primeiro job; outro job usa PostgreSQL temporário com senha fictícia para testar a conexão. Não depende de credenciais reais do projeto. O arquivo de workflow foi preparado localmente; seu resultado remoto deve ser confirmado no GitHub Actions após o push.

Prefira commits pequenos e semânticos. `.env*`, código Prisma gerado, node_modules e `.next` ficam fora do Git; `.env.example` é permitido. Não configure `origin` com tokens na URL. Para um clone já existente, use `git push -u origin main` com autenticação GitHub configurada. Não use push forçado para resolver conflitos.

## Testes e compilação

BF-002 usa o runner nativo de testes do Node via `tsx`, sem introduzir outro framework para testes de configuração. Verifica URLs válidas, variável ausente, protocolos inválidos e mensagens sem conteúdo secreto. O diagnóstico de integração valida `SELECT 1` no PostgreSQL real. Vitest e Playwright continuam planejados para as primeiras regras e fluxos de negócio.

Os scripts usam a opção oficial `--webpack` e o plugin Tailwind/PostCSS. O Turbopack do template falhou na BF-001 ao abrir porta interna de processamento CSS neste ambiente. A stack do produto foi preservada.

## Dependências: pendências conhecidas

A auditoria da BF-001 mostrou cinco alertas altos na cadeia do ESLint (`braces`, GHSA-vfj7-8cjw-p6xm). ESLint 9.39.5 permanece pela compatibilidade dos plugins oficiais, embora o npm informe fim de manutenção. A tentativa com ESLint 10 revelou peers incompatíveis.

BF-002 adicionou alertas de `deepmerge-ts` (GHSA-ggr8-5vv4-36mx) e `mysql2` (GHSA-3f6p-5ww8-9rcr / GHSA-rgwj-5xj2-c3m3) transitivos do CLI Prisma. A auditoria completa retornou nove alertas altos; `--omit=dev` também lista quatro alertas da cadeia Prisma devido ao relacionamento peer de `@prisma/client` com o CLI. Isso não significa que o aplicativo usa MySQL, mas a pendência permanece na árvore instalada.

`npm audit fix` sem `--force` foi executado; os alertas remanescentes sugerem downgrades principais incompatíveis de Prisma e eslint-config-next. Não aplicar automaticamente. Antes de deploy, reavaliar versões corrigidas e a árvore efetivamente incluída no artefato de produção. A BF-002 não declara auditoria limpa.
