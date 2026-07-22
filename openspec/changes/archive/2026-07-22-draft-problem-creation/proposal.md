## Why

Today, creating a problem (`web/app/[locale]/problems/_components/create.tsx`) is a single blocking form: nothing is persisted until the whole thing (title, description, difficulty, all test inputs/outputs) is filled in and submitted, and the moment it is submitted the problem is immediately live and visible to every user (`getProblems` applies no visibility filter at all). There is no way to save partial work, come back later, or preview a problem before publishing it — unlike contests, which already support this via `status: draft|published` (`web/drizzle/schemas/contests.ts`, `createContest`, `publishContest`). This inconsistency means problem authors lose work-in-progress on navigation/crash and can't stage a problem privately before making it public, while contest authors can. Bringing problem creation to the same draft/publish model removes that gap and lets the existing "create contest → add problems" flow reuse freshly-created draft problems.

## What Changes

- Add `status` enum column (`draft` | `published`, default `draft`) to the `problem` table, mirroring `contest.status`.
- **BREAKING**: `createProblem` (`web/lib/actions/problems/create-problem.ts`) changes from "create a fully-formed, immediately-public problem from a submitted form" to "instantly create a placeholder draft row (default title/description, no test cases) and navigate the user to an edit view" — same trigger UX as `createContest`.
- Add an `updateProblem` server action to save edits to a draft (or a published problem, subject to existing edit constraints) without requiring the full form to validate.
- Add a `publishProblem` server action that transitions `draft` → `published`, enforcing the same kind of required-field validation contest publish already does (non-empty title/description, difficulty set, at least one test case with both input and output).
- Restrict problem visibility: `getProblems`, `getProblemBySlug`/`getProblem`, and the problem workspace SHALL only show `draft` problems to their creator, matching `contest` visibility rules.
- Update the problems list UI to show a "Draft" badge for the creator's own draft problems (mirroring `ContestCard`'s `status.badge === "draft"` handling).
- Rework the problem creation page/form to be an edit-in-place view over an existing draft row (like the contest Settings tab + `PublishContest` button) instead of a single create-and-submit form.

## Capabilities

### New Capabilities
- `problem-lifecycle`: Defines problem draft creation, draft visibility restricted to the creator, publish validation requirements, and editing rules for published problems — the problem-side mirror of `contest-lifecycle`.

### Modified Capabilities
- `problem-list-view`: Table listing must exclude other users' draft problems and show a draft indicator for the viewer's own drafts.

## Impact

- `web/drizzle/schemas/problems.ts` — new `ProblemStatus` enum + `status` column, migration required.
- `web/lib/actions/problems/create-problem.ts` — rewritten to instant-draft-create semantics (signature change: no longer takes full `CreateProblemInput`).
- New: `web/lib/actions/problems/update-problem.ts`, `web/lib/actions/problems/publish-problem.ts`, `web/lib/actions/problems/publish-problem-shared.ts` (field-error contract, mirroring `publish-contest-shared.ts`).
- `web/lib/actions/problems/get-problems.ts`, `get-problem.ts`, `get-problem-by-slug.ts` — add draft-visibility filtering.
- `web/app/[locale]/problems/_components/create.tsx`, `web/app/[locale]/problems/new/page.tsx` — reworked into an instant-create button + edit view, new publish button component.
- `web/app/[locale]/problems/_components/list.tsx`, `badge.tsx` — draft badge/indicator.
- `web/hooks/use-create-problem.ts` and new hooks for update/publish.
- Any caller currently expecting `createProblem` to return a fully-populated, publicly-visible problem in one call (e.g. `import-problems.ts` bulk import) must be reviewed for compatibility.
