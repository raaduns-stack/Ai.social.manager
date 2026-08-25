# RaaSocial — Backend (apps/backend)

Foundational NestJS API scaffold. Matches the confirmed stack: NestJS + TypeScript,
Drizzle ORM, PostgreSQL, JWT auth, Swagger.

## What's included

- **App bootstrap** (`src/main.ts`) — global validation, CORS, Swagger docs at `/api/docs`, global error filter and logging interceptor.
- **Config module** (`src/config/`) — typed, validated environment variables. The app refuses to start if required vars are missing, instead of failing later mid-request.
- **Database module** (`src/database/`) — Drizzle + PostgreSQL connection, injectable anywhere via `DATABASE_CONNECTION`. One starter table (`users`) with roles matching the feature docs (client, designer, reviewer, account_manager, super_admin).
- **Auth module** (`src/auth/`) — register, login, JWT access + refresh token issuing, a route guard (`JwtAuthGuard`), and a role guard (`RolesGuard` + `@Roles()` decorator) for admin-only endpoints.
- **Health check** (`src/health/`) — `GET /api/health`, useful for deployment/monitoring.
- **Common layer** (`src/common/`) — a global exception filter (consistent error shape) and a request logging interceptor.

## What's intentionally NOT included yet

This is a foundation, not the full backend. Not built yet: subscriptions/billing,
content calendar, uploads, AI integration (Gemini/OpenClaw), notifications, support
tickets, analytics, admin-side modules. Each should follow the same pattern as
`auth/`: its own folder with a `.module.ts`, `.controller.ts`, `.service.ts`, DTOs,
and a schema file under `database/schema/`.

## Setup

```bash
cd apps/backend
npm install
cp .env.example .env
# fill in .env with real values — especially DATABASE_URL and the two JWT secrets

npm run db:generate   # generates SQL migration files from the schema
npm run db:migrate    # applies them to the database

npm run start:dev     # starts the API on http://localhost:4000/api
```

Swagger docs will be live at `http://localhost:4000/api/docs` once running.

## Adding a new table

1. Create `src/database/schema/<name>.schema.ts` following the pattern in `users.schema.ts`.
2. Re-export it from `src/database/schema/index.ts`.
3. Run `npm run db:generate` then `npm run db:migrate`.

## Adding a new module

Mirror the `auth/` folder: a `.module.ts` that gets imported into `app.module.ts`,
a controller for routes, a service for logic, and DTOs with `class-validator`
decorators for anything the client sends in.

## Notes / things flagged for follow-up

- The `/auth/refresh` endpoint is simplified for this scaffold — see the comment
  in `auth.controller.ts` for what production needs (separate refresh-token
  strategy + a revocation table).
- `DATABASE_URL` in `.env.example` mirrors the `socialpilot_ai` Postgres instance
  from the dev server credentials doc — swap in the real password locally, never
  commit it.
