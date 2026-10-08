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

Unit tests use Bun's built-in runner (`bun test lib`) for pure modules only (`lib/blocks/portugol-generator.test.ts`, `lib/parsons.test.ts`). There is no DB/server-action test setup.

## Architecture

**Next.js 16 App Router** with server actions as the primary data layer. No tRPC, no REST routes beyond `/api/auth`.

### Request Flow

```
Browser → React Query hook (/hooks/) → Server Action (/lib/actions/) → Drizzle ORM → PostgreSQL
```

Server actions handle auth checks, business logic, and DB queries. Hooks wrap actions with `useQuery`/`useMutation`.

### Key Directory Map

| Path                  | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `app/[locale]/`       | All pages, locale-prefixed via `next-intl` |
| `lib/actions/`        | All server actions (`"use server"`)        |
| `lib/auth/`           | Better Auth setup + session helpers        |
| `hooks/`              | React Query wrappers around server actions |
| `drizzle/schemas/`    | Drizzle table definitions                  |
| `drizzle/migrations/` | SQL migration history                      |
| `components/ui/`      | Radix UI-based component library           |
| `messages/`           | i18n strings (pt, en)                      |
| `env.ts`              | Typed env vars via `@t3-oss/env-nextjs`    |

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

`getAIHelp()` server action calls Gemini (model id in `lib/gemini-model.ts`, shared by every AI feature) to explain submission failures. Contest submissions are capped by `contest.aiAssistance` (`off`/`concept`/`hint`/`pinpoint`), enforced server-side; the dialog reveals levels one at a time. Parses JSON output from Judge to identify which test cases failed.

### AI Problem Review

`reviewProblem()` server action (`lib/actions/problems/review-problem.ts`) calls Gemini with structured JSON output (`responseSchema`) to critique a draft problem's description and suggest edge-case test cases (input/output/rationale). Nothing is persisted — the edit workspace's `ProblemReviewPanel` lets the author add any suggested edge case to the form's test cases with one click, saved only when the form is submitted normally.

### Problem Narrative

`problem.narrative` is an optional text field (nullable) shown above the description on the standalone problem page when set, styled as flavor text — never required for publish. `generateProblemNarrative()` (`lib/actions/problems/generate-problem-narrative.ts`) drafts an Advent-of-Code-style themed story via Gemini into the edit form's narrative field for the author to edit/save through the existing `updateProblem` action.

### Exercise Answer Modes (code / blocks / parsons)

Lesson exercises have `exercise.mode` (`exercise_mode` enum, default `code`), set per exercise via `setExerciseMode` (`lib/actions/lessons/exercise-mode.ts`) — never per problem.

- `blocks`: students build the program in Blockly (`components/blocks/`, client-only, loaded via `next/dynamic`). Forces `primaryLanguage = portugol`. `lib/blocks/portugol-generator.ts` walks Blockly's **serialized JSON** (no Blockly import), so the same function runs in the browser ("view code" panel) and in `createExerciseSubmission`, which regenerates `code` from the submitted workspace and ignores any client code. Every block type in `lib/blocks/definitions.ts` must be handled by the generator.
- `parsons`: the professor's `exercise.parsonsSolution` is split into lines (`lib/parsons.ts`); students get them shuffled by `getExercise` (the solution itself is never sent to students — keep `parsonsSolution` out of student-facing queries). On submit the server checks the lines are exactly the solution's lines and assembles the program. A solution is only accepted after a judge run passes: `checkParsonsSolution` reuses `problem_validation` with `exercise_id` set, and the problem's own publish/staleness checks filter `exercise_id IS NULL`.
- Both modes store `submission.editorMode` + `submission.visualSource`; `code` is always what the judge ran. `components/submissions/visual-answer.tsx` renders them read-only. The judge needs no changes (it claims rows with an explicit column list).
- AI hints (`getUserPrompt`) get mode-specific instructions: blocks → refer to block labels in the student's locale; parsons → only order/indentation.

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
