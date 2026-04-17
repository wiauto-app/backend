# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## languaje
Always respond in neutral Spanish. Avoid regional slang (especially Argentinian voseo).

## Common Commands

Package manager is `pnpm@9`. Scripts are invoked via `node --run <script>` (Node 22 native runner) or `pnpm <script>`.

### Development
- `pnpm dev` — start Nest in watch mode with debug on `0.0.0.0:9229`
- `pnpm build` — clean `dist/` and compile with SWC using `tsconfig.prod.json`
- `pnpm start` — run compiled output from `dist/main.js`

### Testing
- `pnpm test` — runs unit + e2e in parallel (concurrently) and merges coverage
- `pnpm test:unit` — Vitest on `tests/unit/**/*.test.ts`
- `pnpm test:e2e` — Vitest on `tests/e2e/**/*.test.ts`
- `pnpm test:performance` — k6 load tests from `tests/performance/`
- Single file: `pnpm vitest run tests/unit/path/to/file.test.ts --config vitest.config.unit.ts`

Tests live in `tests/` at the **root**, NOT co-located with source. The mapping is `tests/{unit,e2e}/<mirror-of-src-path>`.

### Linting & quality
- `pnpm lint` / `pnpm lint:fix`
- `pnpm typos` — spell check via `_typos.toml`
- Husky runs lint-staged + commitlint (conventional commits) on commit

### Database migrations (TypeORM)
- `pnpm migration:generate src/database/migrations/<Name>` — diff entities against DB
- `pnpm migration:create src/database/migrations/<Name>` — empty migration
- `pnpm migration:run` / `pnpm migration:revert` / `pnpm migration:show`

### Infrastructure (docker-compose)
Only `postgres`, `redis`, and `opensearch` services are active. The `my-service-dev/prod` and `k6` services are commented out — the Node app runs on the host, not in a container.

```bash
docker-compose up -d postgres redis opensearch
```

## Architecture

### NestJS + Fastify + SWC
- Web framework: **Fastify** (not Express) via `@nestjs/platform-fastify`
- Compiler: **SWC** (configured in `.swcrc` with `decoratorMetadata: true`) — ~20x faster than tsc, used by both Nest CLI (`nest-cli.json` → `builder: "swc"`) and Vitest (`unplugin-swc`)
- Global API prefix: `/api` (set in `main.ts`)
- Global `ValidationPipe` with `whitelist`, `forbidUnknownValues`, `transform: true`

### Module organization — contexts pattern
Source is organized by bounded context under `src/contexts/<name>/`, each containing:
- `api/` — controllers
- `services/` — business logic
- `entities/` — TypeORM entities
- `dto/` — request/response DTOs
- `guards/` — Nest guards (auth only)
- `<name>.module.ts` — the Nest module

Current contexts: `auth`, `users`, `profiles`, `shared` (cross-cutting: `logger`).

`src/app/` holds the root `AppModule` and generic cross-cutting modules like `health`. `src/common/envs.ts` validates `process.env` with Zod at boot — import `envs` from here instead of reading `process.env` directly.

### Path aliases
```
@/src/*      → src/*
@/app/*      → src/app/*
@/contexts/* → src/contexts/*
@/shared/*   → src/contexts/shared/*
@/tests/*    → tests/*
```

### Database — dual TypeORM setup (IMPORTANT)
There are **two** DataSource files with different jobs. Do not unify them.

- `src/database/data-source.ts` — used by `AppModule` at runtime. Uses `__dirname + '/../**/*.entity{.ts,.js}'` globs so it resolves correctly against both `src/` (dev) and `dist/` (prod).
- `src/database/migrations-source.ts` — used by the TypeORM CLI. Uses simple relative paths (`src/**/*.entity.ts`) assuming execution from the project root. The `migration:*` scripts point at this file via `-d`.

The CLI runs as CommonJS (via `typeorm-ts-node-commonjs`), while the rest of the codebase is compiled to ESM by SWC. To make this work, `tsconfig.json` has a `ts-node` override block that forces `module: commonjs` + `moduleResolution: node` **only** for ts-node. Keep that override intact.

### Auth
JWT + Passport. `AuthModule` registers `JwtModule` with `envs.JWT_SECRET` and 30-day expiry. `PasswordService` is shared between `AuthModule` and `UserModule` (both register it as a provider — note this duplication exists).

## Conventions & Gotchas

- **`"type": "commonjs"`** in `package.json`. The README claims ESM but the project currently runs CJS to keep TypeORM CLI simple. Don't use `import.meta.url` in code that runs at runtime (e.g. `data-source.ts`) — use the global `__dirname` instead.
- **Tests are not co-located.** Creating `*.spec.ts` next to source files will not be picked up. Put tests in `tests/unit/` or `tests/e2e/` mirroring the `src/` path.
- **Commits follow Conventional Commits** (enforced by commitlint). No Co-Authored-By or AI attribution.
- **`.env` is required** at project root (loaded by `dotenv` in both `envs.ts` and the DataSource files). Required keys: `PORT`, `DATABASE_URL`, `JWT_SECRET`.
- Coverage combines unit + e2e via `calculate-global-test-coverage` script after `pnpm test`.
