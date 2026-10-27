## Context

`web/app/[locale]/page.tsx` is a client component serving the public landing page, with hero buttons to `/contests` and `/problems` that double as the signed-in entry point. The dock's Home icon and the command palette's "Go home" both push `/`. Post-auth fallback is `/` (`safeRedirectPath` in `lib/auth/redirect-path.ts`).

Relevant data already exists:
- Classes: `classroom_membership`, `lesson` (`isPublished`, `dueDate`), `exercise`, `lesson_submission` (one row = lesson submitted), `submission.exerciseId` + `status = PASSED` for per-exercise progress (same derivation as `listClassLessons`).
- Contests: `contest` (`status`, `startDate`, `endDate`, `isPrivate`), `user_on_contest` (`joinStatus`) — **no join timestamp**.
- Problems: `problem` (`status`, `difficulty`, `tags[]`, `createdBy`), `submission` (`problemId`, `status`, `createdAt`).

## Goals / Non-Goals

**Goals:**
- Landing = pure marketing page with one auth-aware CTA.
- `/home` = server-rendered, read-only snapshot of the user's classes, contests, solves, plus suggestions.
- Reuse existing derivations (lesson progress, contest running window) instead of inventing new semantics.

**Non-Goals:**
- Professor-specific dashboard (owned classes, pending reviews, join requests). Professors see the same widgets; owned classes are simply excluded from "pending". Could be a follow-up.
- Activity feed, streaks, stats charts.
- Auto-redirecting signed-in users from `/` to `/home` (keeps landing shareable and viewable).
- ML/embedding-based recommendations.

## Decisions

**Route: `/home`, separate from `/`.** Alternative: render landing or dashboard at `/` depending on session. Rejected — mixes a static, cache-friendly marketing page with per-user data, and makes the landing unreachable for signed-in users (needed for the TCC demo).

**One server action `getHomeData()` in `lib/actions/home/get-home-data.ts`, wrapped by `useHomeData()` hook.** Returns `{ pendingLessons, runningContests, lastJoinedContest, recentSolves, suggestedProblems, suggestedContests }`, running independent queries with `Promise.all`. Alternative: one action per widget with per-widget suspense. Rejected for now — single round trip, data is small; the widgets are separate components so splitting later is cheap. The page itself is a server component calling `requireOnboardedUser({ redirectTo: "/auth/signin" })`, then a client `HomeDashboard` uses the hook (matches existing pages like `/classes`). No mutations → no cache invalidation work, but `joinContest`/`submitLesson`/submission mutations should add the `["home"]` query key to their invalidations (per `mutation-cache-invalidation` skill) so returning to `/home` is fresh.

**Pending lessons query.** Memberships of the user (excluding owned classes) → published lessons in those classes → left-anti-join `lesson_submission` for the user. Progress = count of distinct exercise ids with a `PASSED` submission by the user / exercise count, scoped by `exerciseId` (not `problemId`), mirroring `listClassLessons`. Order `due_date ASC NULLS LAST`, limit 5.

**Add `user_on_contest.joined_at`.** "Last joined" is impossible to order otherwise. Column `timestamp`, `DEFAULT now()`, nullable; existing rows stay `NULL` (unknowable). Ordering: `COALESCE(joined_at, contest.start_date, contest.created_at) DESC`. Alternative: infer from first submission in the contest — misses joined-but-not-submitted, rejected. `joinContest` needs no code change (default), but verify it doesn't insert explicit column lists that bypass it.

**Running window** = `status = 'published' AND start_date <= now() AND end_date > now()`, same rule as contest-lifecycle. Use DB `now()` to avoid server clock skew. Last-joined excludes ids already in running.

**Recent solves.** `SELECT problem_id, max(created_at) FROM submission WHERE user_id = $1 AND status = 'PASSED' GROUP BY problem_id ORDER BY 2 DESC LIMIT 5`, then join problem (title, code, slug, difficulty). Includes contest and exercise passes — a solve is a solve.

**Suggestions — simple heuristic, in SQL.**
- Problems: candidates = `status = 'published' AND created_by <> me AND id NOT IN (my passed problem ids)`. Score = tag overlap with my solved problems' tags (`cardinality(array(select unnest(tags) intersect select unnest($myTags)))`) DESC, then `abs(difficulty_rank - my_median_rank)` ASC, then random tiebreak. New user (no solves) → easiest difficulty first. Limit 3. Random tiebreak via `ORDER BY ..., md5(id::text || current_date)` so suggestions are stable within a day rather than flickering on refetch.
- Contests: `status = 'published' AND is_private = false AND (end_date IS NULL OR end_date > now()) AND id NOT IN (my contests)`, order `start_date ASC`, limit 3.
Alternative: AI-generated suggestions via `lib/ai.ts` — rejected: latency/cost on every page load, no clear quality gain at this data size.

**Landing CTA.** Landing stays a client component; use `authClient.useSession()` (as `UserDock` does) to choose label/href. Render "Get started" during session loading to avoid layout shift and never block the hero. Remove `HomePage.buttons.*`, add `HomePage.cta.getStarted` / `HomePage.cta.goHome`.

**Navigation.** Dock and palette pick `/home` vs `/` from session; dock active-state check must treat `/home` as Home. `safeRedirectPath` fallback changes `"/"` → `"/home"`; `withRedirectTo` keeps treating `"/"` as "no redirect". Unauthenticated `getCurrentUser` default (`redirectTo || "/"`) unchanged.

**Page layout** follows the `creating-a-page` skill (shared `PageHeader`, `max-w-5xl`). Grid: pending lessons + running contest on top (most time-sensitive), solves + last contest middle, suggestions bottom. Two columns on `md+`, stacked on mobile.

## Risks / Trade-offs

- [Existing `user_on_contest` rows have no `joined_at`] → COALESCE fallback to contest start; ordering among old rows is approximate, correct for all new joins.
- [Migration numbering collision with parallel worktrees sharing one DB] → check sibling worktrees' `web/drizzle/migrations/` before `bun db:generate`; this change's migration is additive and trivially renumberable.
- [Suggestion query cost grows with problem count] → bounded by `LIMIT`, uses existing indexes on `submission(user_id)`; fine at TCC scale. Revisit with a materialized view only if slow.
- [Landing CTA flicker when session resolves] → default to "Get started"; both buttons same size.
- [Professors see a mostly-empty home] → empty states link to `/classes`; professor widgets noted as follow-up.

## Migration Plan

1. Add `joinedAt` to `userOnContest` schema, `bun db:generate` → `0047_*.sql` (`ALTER TABLE user_on_contest ADD COLUMN joined_at timestamp DEFAULT now()`), `bun db:migrate`.
2. Deploy web. Judge unaffected (doesn't touch `user_on_contest`).
Rollback: revert web; the extra nullable column is harmless and can stay.

## Open Questions

- Should `/` auto-redirect signed-in users to `/home`? Current design: no (decided above); easy to flip later.
- Include a small professor section (lessons awaiting review, pending contest join requests) now or as follow-up? Default: follow-up.
