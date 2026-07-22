## Context

`contest` already has `status: draft|published` with a validated instant-create → edit-in-place → publish flow (`web/lib/actions/contest/create-contest.ts`, `update-contest.ts`, `publish-contest.ts`, `publish-contest-shared.ts`, `web/app/[locale]/contests/_components/tabs/settings/`). `problem` has no such column: `createProblem` (`web/lib/actions/problems/create-problem.ts`) takes a fully-populated `CreateProblemInput` and inserts a row that is immediately visible to everyone, since `getProblems`/`getProblemBySlug` apply no status filter at all. This change ports the contest pattern onto problems 1:1 where the domains match, and diverges only where problem shape genuinely differs (no start/end dates; instead required-field validation is title/description/difficulty/≥1 test case).

## Goals / Non-Goals

**Goals:**
- Add `problem.status` (`draft` default, `published`) mirroring `contest.status`.
- Replace the single-shot create form with instant-draft-create + edit-in-place + explicit publish, matching contest UX.
- Hide other users' draft problems from listings, direct slug access, and the standalone workspace.
- Reuse the `MISSING_FIELDS:` client/server validation contract pattern from `publish-contest-shared.ts`.

**Non-Goals:**
- No change to contest-side problem attachment (`contest/add-problem.ts`) beyond it only being able to attach a problem the caller can see (draft problems already excluded from `contest/add-problem`'s picker since it likely queries `getProblems`-shaped data — verify at implementation time, not a spec requirement here).
- No change to `import-problems.ts` semantics: bulk-imported problems continue to be created directly usable (see Decisions) — they are not required to pass through the interactive draft/publish flow.
- No retroactive migration of existing rows' review state beyond a default value backfill.

## Decisions

**1. `status` column, not a new table.** Same shape as `ContestStatus`: `pgEnum("problem_status", ["draft", "published"])`, `default("draft").notNull()`. Consistent with existing enum-on-row pattern used for `ContestStatus`/`SubmissionStatus`; a separate lifecycle table would be over-engineering for a two-state flag.

**2. Existing rows default to `published`.** The migration must backfill `status = 'published'` for all pre-existing `problem` rows (via `.default("published")` in the migration SQL before switching the app-level default to `"draft"`, or an explicit `UPDATE problem SET status = 'published'` backfill step) — otherwise every problem created before this change silently disappears from public listings. This mirrors how `contest.status` migration must have handled pre-existing contests (none existed at contest launch, but the risk is real for problems since problems predate this change).

**3. `importProblems` inserts as `published` directly**, not `draft`. Bulk import is an operator/admin bulk-load tool for a known-good problem set (see `problems.json` at repo root), not the interactive single-problem authoring flow this change targets. Forcing every bulk-imported row through manual publish would regress that tool. `import-problems.ts`'s insert `values` map gets `status: "published"` added explicitly.

**4. `createProblem` becomes zero-argument**, like `createContest`. Old signature `createProblem(input: CreateProblemInput)` is removed; new `createProblem()` inserts `{ slug: generateSlug("untitled-problem"), createdBy, status: "draft" }` relying on schema defaults for the rest (title, description need placeholder defaults added to the schema/insert, matching `contest.name.default("Untitled Contest")`). This is the **BREAKING** change flagged in the proposal — only call site (`create.tsx`'s submit handler) is rewritten in the same change, so nothing is left calling the old signature.

**5. Validation lives in a shared module** `publish-problem-shared.ts` exporting `PublishProblemFieldError = "title" | "description" | "difficulty" | "tests"` and `PUBLISH_MISSING_FIELDS_PREFIX`, reusing the exact `MISSING_FIELDS:field1,field2` wire contract so the client-side parsing logic in the new publish button is a near copy of `publish-button.tsx`. "tests" fails if `inputs.length === 0 || outputs.length !== inputs.length` (no test case, or mismatched pairs).

**6. Visibility filter placed at the query layer**, not via post-fetch filtering — same `or(eq(status, 'published'), eq(createdBy, currentUser.id))` predicate contest uses in `get-contests.ts`, applied in `get-problems.ts`, `get-problem.ts`, `get-problem-by-slug.ts`. Direct slug access to another user's draft resolves as not-found (already the behavior contest takes per `contest-lifecycle` spec's "Other user browses contest list" scenario) rather than a 403 — avoids leaking existence of the draft.

**7. Edit-in-place UI reuses the contest Settings tab structure** conceptually but does not literally move problem editing into a tabbed workspace tab — the existing standalone `/problems/[slug]` workspace already has 5 tabs for a *published* problem's consumer-facing view (Task/Submit/Results/Statistics/Tests per `problem-workspace` spec) and repurposing it for authoring would conflict with that spec. Instead, `/problems/new` navigates to `/problems/[slug]/edit` (new route) which renders the existing `NewProblem` form pre-filled from the draft row, with a Publish button shown only while `status === "draft"`, matching `ContestSettings`'s conditional render of `PublishContest`.

## Risks / Trade-offs

- [Existing problems vanish from listings if backfill is skipped] → Migration SQL explicitly backfills `status = 'published'` for all rows before/alongside adding the `NOT NULL DEFAULT 'draft'` constraint; add a task to verify row count pre/post migration.
- [`createProblem()` signature change breaks any other caller] → grep confirms only `create.tsx` calls it directly; `import-problems.ts` uses `db.insert(problem)` directly, unaffected.
- [Draft problems attachable to contests by slug/ID guess] → `contest/add-problem.ts` must be checked at implementation time to ensure it can only attach problems the caller can see (reuse the same visibility predicate), otherwise a contest owner could attach someone else's still-drafting problem.
- [Placeholder defaults for title/description on instant-create] → schema needs `title.default("Untitled Problem")` and `description.default("")` (currently both `.notNull()` with no default) — same treatment `contest.name`/`contest.description` already got.

## Migration Plan

1. Add `status` column + enum to schema, generate migration (`bun db:generate`), hand-edit the generated SQL if needed to add the `published` backfill `UPDATE` before the `NOT NULL` constraint lands (Drizzle's generated migration alone won't know old rows should be `published` rather than the new `draft` default).
2. Add placeholder defaults for `title`/`description` in the same migration.
3. Ship server actions (`createProblem` rewrite, `updateProblem`, `publishProblem`, shared validation module) and query-layer visibility filters together (same PR/change) — a partial deploy where drafts exist but aren't hidden yet is a visibility bug, not a safe intermediate state.
4. Ship UI changes last, once actions are in place.

No feature flag: this is a low-traffic internal/thesis-scale app (per `CLAUDE.md`), and contest draft/publish shipped the same way without one.

## Open Questions

- Should `contest/add-problem.ts`'s problem picker exclude other users' drafts, or is that already implicit via whatever query it uses? Needs a read at implementation time (flagged as a risk above, not blocking the design).
