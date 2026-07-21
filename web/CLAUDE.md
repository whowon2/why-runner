# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev           # Start dev server
bun build         # Production build
bun lint          # Biome check
bun format        # Biome format --write

bun db:push       # Push schema changes to DB (no migration file)
bun db:generate   # Generate migration SQL
bun db:migrate    # Run pending migrations
bun db:studio     # Drizzle Studio GUI
bun db:seed       # Seed database
```

No test suite exists yet.

## Architecture

**Next.js 16 App Router** with server actions as the primary data layer. No tRPC, no REST routes beyond `/api/auth`.

### Request Flow

```
Browser → React Query hook (/hooks/) → Server Action (/lib/actions/) → Drizzle ORM → PostgreSQL
```

Server actions handle auth checks, business logic, and DB queries. Hooks wrap actions with `useQuery`/`useMutation`.

### Key Directory Map

| Path | Purpose |
|---|---|
| `app/[locale]/` | All pages, locale-prefixed via `next-intl` |
| `lib/actions/` | All server actions (`"use server"`) |
| `lib/auth/` | Better Auth setup + session helpers |
| `hooks/` | React Query wrappers around server actions |
| `drizzle/schemas/` | Drizzle table definitions |
| `drizzle/migrations/` | SQL migration history |
| `components/ui/` | Radix UI-based component library |
| `messages/` | i18n strings (pt, en) |
| `env.ts` | Typed env vars via `@t3-oss/env-nextjs` |

### Database Schema (PostgreSQL via Drizzle)

- `user`, `session`, `account`, `verification` — Better Auth tables
- `problem` — Code problems with test `inputs[]`/`outputs[]` arrays, `difficulty` enum
- `submission` — Execution results, `status`: `PENDING|RUNNING|PASSED|FAILED|ERROR`, supports languages: `c|cpp|java|python|portugol|rust`
- `contest` — Contests with date range, `isPrivate` flag
- `userOnContest` — Join table with `joinStatus`: `pending|accepted`
- `problemOnContest` — Problem assignment to contest
- `activityFeed` — User activity events

### Submission Pipeline

1. `createSubmission` server action rate-limits (5/30s), validates user is accepted in contest, writes `PENDING` row
2. Calls `pg_notify('new_submission', submissionId)` — picked up by external Judge worker (Rust, separate repo)
3. Judge executes code in Docker (python:3.9-slim or equivalent) and writes result back
4. Frontend polls submission status via React Query

### Auth

Better Auth with email/password + GitHub + Google OAuth. Session access:
- Server: `getCurrentUser()` in `lib/auth/get-current-user.ts` (redirects to signin if unauthenticated)
- Client: `authClient` from `lib/auth/client.ts`

### AI Help

`getAIHelp()` server action calls Gemini 2.0 Flash to explain submission failures. Parses JSON output from Judge to identify which test cases failed.

## Environment Variables

Required in `.env`:
```
DATABASE_URL=psql://judge:judge@localhost:5433/judge
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GITHUB_ID=
GITHUB_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_KEY=
```

## Conventions

- **Linting/formatting:** Biome (not ESLint/Prettier). Run `bun lint` before committing.
- **Path alias:** `@/` maps to project root.
- **Imports:** Biome organizes imports automatically on format.
- **UI:** Tailwind v4 + Radix UI primitives. No CSS modules.
- **Forms:** React Hook Form + Zod schemas.
- **URL state:** `nuqs` for search params.
