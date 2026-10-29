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

**Every export of a `"use server"` module is a public POST endpoint** callable with arbitrary arguments, whatever its TypeScript types say. So each action must:

- authenticate (`getCurrentUser`) and check ownership itself;
- parse its input with an explicit zod schema and write only listed fields (never `.values({ ...input })` / `.set({ ...input })`);
- return other users' rows with `publicUserColumns` (`lib/public-user.ts`), never `email`;
- pass any `submission.output` it returns through `redactReport` (`lib/judge-report.ts`) so hidden tests stay hidden.

Server-only helpers (no auth of their own) go outside `lib/actions/` and start with `import "server-only"` (e.g. `lib/constraints/classify.ts`).

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
- `submission` — Execution results, `status`: `PENDING|RUNNING|PASSED|WRONG_ANSWER|TIME_LIMIT_EXCEEDED|MEMORY_LIMIT_EXCEEDED|COMPILATION_ERROR|RUNTIME_ERROR|ERROR|CONSTRAINT_VIOLATION|PENDING_CONSTRAINT_CLASSIFICATION` (+ legacy `FAILED` on old rows; `ERROR` = judge fault), supports languages: `c|cpp|java|python|portugol|rust`. Show statuses with `StatusBadge` (`components/submissions/status-badge.tsx`, labels under `SubmissionStatus` in `messages/`) and branch on them via `lib/submission-status.ts`
- `contest` — Contests with date range, `isPrivate` flag
- `userOnContest` — Join table with `joinStatus`: `pending|accepted`
- `problemOnContest` — Problem assignment to contest
- `activityFeed` — User activity events

### Submission Pipeline

1. `createSubmission` server action rate-limits (5/30s), validates user is accepted in contest, writes `PENDING` row
2. Calls `notifyJudge()` (`lib/judge.ts`): `pg_notify('new_submission', submissionId)` for a running judge, plus (after the response, if `FLY_API_TOKEN` is set) a Fly Machines API start for a judge that idle-exited
3. Judge executes code in Docker (python:3.9-slim or equivalent) and writes result back
4. Frontend polls submission status via React Query

### Auth

Better Auth with email/password + GitHub + Google OAuth. Session access:

- Server: `getCurrentUser()` in `lib/auth/get-current-user.ts` (redirects to signin if unauthenticated)
- Client: `authClient` from `lib/auth/client.ts`

### AI Help

Every AI feature calls `generateText`/`generateJson` in `lib/ai.ts` (never the provider SDKs directly). It tries `claude-haiku-5-5` (only if `ANTHROPIC_API_KEY` is set) → `gemini-3.5-flash` → `gemini-3.5-flash-lite` (ids in `lib/ai-models.ts`), 30s per attempt, falling through only on timeout/network/404/429/5xx/invalid output. `generateJson` takes a zod schema used for both providers and re-validates the result. `lib/ai.ts` is intentionally not a `"use server"` module.

`getAIHelp()` server action uses it to explain submission failures. Contest submissions are capped by `contest.aiAssistance` (`off`/`concept`/`hint`/`pinpoint`), enforced server-side; the dialog reveals levels one at a time. Parses JSON output from Judge to identify which test cases failed.

### AI Problem Review

`reviewProblem()` server action (`lib/actions/problems/review-problem.ts`) uses `generateJson` to critique a draft problem's description and suggest edge-case test cases (input/output/rationale). Nothing is persisted — the edit workspace's `ProblemReviewPanel` lets the author add any suggested edge case to the form's test cases with one click, saved only when the form is submitted normally.

### Problem Narrative

`problem.narrative` is an optional text field (nullable) shown above the description on the standalone problem page when set, styled as flavor text — never required for publish. `generateProblemNarrative()` (`lib/actions/problems/generate-problem-narrative.ts`) drafts an Advent-of-Code-style themed story via `generateText` into the edit form's narrative field for the author to edit/save through the existing `updateProblem` action.

### Output Comparison

`problem.compareMode` (`exact|tokens|float|checker`, default `tokens`; pre-0048 problems are `exact`) and `problem.floatEpsilon` tell the judge how to compare output (semantics in `judge/CLAUDE.md`). A custom checker lives in the separate `problem_checker` table so student queries that load whole `problem` rows can't leak it: read it only via `getProblemChecker` (`lib/problem-checker.ts`, server-only) and only send it to the problem's owner (`getProblemForEdit`). `updateProblem` writes the settings and upserts/deletes the checker in one transaction. `computeIoHash` includes the comparison settings when the mode isn't `exact`, so changing them makes the validation stale.

### Problem Tags

`problem.tags` is an array of the fixed `problem_tag` pg enum (`PROBLEM_TAGS` in `drizzle/schemas/problems.ts`); labels live under `ProblemTags` in `messages/`. Keys are permanent — add new ones via migration, don't rename/remove. The problems list filters with array-contains (problem must have all selected tags, URL param `tags=a,b`). `suggestProblemTags()` (`lib/actions/problems/suggest-problem-tags.ts`) uses `generateJson` (zod enum schema) for 1–5 tags from the edit form's unsaved title/description; it only pre-fills the form's tag picker, saved via `updateProblem`.

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
ANTHROPIC_API_KEY=   # optional, makes Claude Haiku the first AI provider (Gemini becomes the fallback)
FLY_API_TOKEN=       # optional, wakes the idle-stopped Fly judge (lib/judge.ts)
SURVEY_ADMIN_EMAILS= # optional, comma-separated emails that can open /surveys/results
SURVEY_PREVIEW_EMAILS= # optional, comma-separated emails that can open read-only /surveys/preview/[form]
```

## Local Test Accounts

Email/password accounts in the local dev database (shared by every worktree), for driving the app in a browser. Test-only, never real credentials:

| Role    | Email               | Password         |
| ------- | ------------------- | ---------------- |
| teacher | `teacher@email.com` | `teacherteacher` |
| student | `user@email.com`    | `useruser`       |

If one is missing (fresh DB), create it through the normal sign-up page. Social login only works on `:3000`, so use these on other worktree ports.

## Conventions

- **Linting/formatting:** Biome (not ESLint/Prettier). Run `bun lint` before committing.
- **Path alias:** `@/` maps to project root.
- **Imports:** Biome organizes imports automatically on format.
- **UI:** Tailwind v4 + Radix UI primitives. No CSS modules.
- **Forms:** React Hook Form + Zod schemas.
- **URL state:** `nuqs` for search params.
