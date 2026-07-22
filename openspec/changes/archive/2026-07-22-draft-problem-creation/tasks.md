## 1. Schema & Migration

- [x] 1.1 Add `ProblemStatus` enum (`pgEnum("problem_status", ["draft", "published"])`) and `status` column (default `"draft"`, not null) to `web/drizzle/schemas/problems.ts`
- [x] 1.2 Add default placeholder values for `title` (`"Untitled Problem"`) and `description` (`""`) on the `problem` table, matching `contest.name`/`contest.description` defaults
- [x] 1.3 Run `bun db:generate`, then hand-edit the generated migration to backfill `status = 'published'` for all pre-existing rows before/alongside applying the `NOT NULL DEFAULT 'draft'` constraint
- [x] 1.4 Run `bun db:migrate` against local DB and verify existing problem rows are `published` and visible as before

## 2. Server Actions

- [x] 2.1 Rewrite `web/lib/actions/problems/create-problem.ts`: `createProblem()` takes no args, inserts `{ slug: generateSlug("untitled-problem"), createdBy, status: "draft" }`
- [x] 2.2 Add `web/lib/actions/problems/publish-problem-shared.ts` exporting `PublishProblemFieldError = "title" | "description" | "difficulty" | "tests"` and `PUBLISH_MISSING_FIELDS_PREFIX`
- [x] 2.3 Add `web/lib/actions/problems/publish-problem.ts`: `publishProblem(problemId)` — ownership check, `status === "draft"` check, field validation (title, description, difficulty, ≥1 matching input/output pair), throws `MISSING_FIELDS:...` on failure, else sets `status: "published"`
- [x] 2.4 Add `web/lib/actions/problems/update-problem.ts`: `updateProblem(input)` scoped by `createdBy = currentUser.id`, regenerates slug on title change, no required-field validation (drafts can be partially saved)
- [x] 2.5 Add visibility filter (`or(eq(problem.status, "published"), eq(problem.createdBy, currentUser.id))`) to `get-problems.ts`, `get-problem.ts`, `get-problem-by-slug.ts`
- [x] 2.6 Set `status: "published"` explicitly on inserted rows in `web/lib/actions/problems/import-problems.ts`
- [x] 2.7 Check `web/lib/actions/contest/add-problem.ts`'s problem-selection query and apply the same visibility filter if missing, so other users' drafts aren't attachable to a contest — picker uses `useProblems`/`getProblems`, which already filters; no change needed

## 3. Hooks

- [x] 3.1 Update `web/hooks/use-create-problem.ts` to the new zero-arg `createProblem` signature
- [x] 3.2 Add `web/hooks/use-update-problem.ts` (React Query mutation wrapper)
- [x] 3.3 Add `web/hooks/use-publish-problem.ts` (React Query mutation wrapper)

## 4. UI

- [x] 4.1 Add a "Create Problem" trigger that calls `createProblem()` immediately and navigates to the new edit route, mirroring `web/app/[locale]/contests/_components/create/button.tsx`
- [x] 4.2 Add `/problems/[slug]/edit` route rendering the existing `NewProblem` form pre-filled from the draft/published row, wired to `updateProblem` instead of one-shot `createProblem`
- [x] 4.3 Add a publish button component (mirroring `publish-button.tsx`) shown only while `status === "draft"`, with client-side missing-field precheck using `publish-problem-shared.ts`
- [x] 4.4 Update `web/app/[locale]/problems/_components/list.tsx` and `badge.tsx` to show a "Draft" indicator for the viewer's own draft problems
- [x] 4.5 Update `web/app/[locale]/user/_components/my-problems.tsx` if it renders problem status/dates, to handle draft problems consistently with `my-contests.tsx`
- [x] 4.6 Remove/redirect the old `web/app/[locale]/problems/new/page.tsx` single-shot form flow in favor of the instant-create trigger

## 5. i18n

- [x] 5.1 Add translation keys for "Draft" badge, publish button, and missing-field messages in `web/messages/en.json` and `web/messages/br.json`, mirroring the `ContestsPage` equivalents

## 6. Verification

- [x] 6.1 `bun lint` in `web/` — pre-existing unrelated errors only (management/participants.tsx, prompt.ts, safari.tsx, select-problem.tsx, submission-list.tsx, pending-joins.tsx); no new errors from this change; `tsc --noEmit` clean
- [x] 6.2 Manually verify: create draft → save partial edits → publish blocked with missing fields → fill required fields → publish succeeds → problem now visible to other users — verified end-to-end via Playwright against the dev server + DB inspection (status transitioned draft→published, all fields persisted)
- [x] 6.3 Manually verify: draft problem invisible to a second user in list and via direct slug URL — verified: search returns 0 draft rows for non-owner, direct slug nav renders 404
- [x] 6.4 Manually verify: bulk import still produces immediately-visible problems — verified via UI upload; row created with `status = published` immediately
