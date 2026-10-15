## Why

An audit of `web/lib/actions/` found server actions that trust client input or skip authorization. Every export of a `"use server"` module is a public POST endpoint, so these are exploitable from the browser console:

- A contest participant can submit an already-`PASSED` row.
- Anyone can remove problems from any contest.
- Every failed run sends one hidden test case's input and expected output to the student.
- The LLM can be called anonymously.

These undermine the core promise of a judged platform (correct verdicts, secret tests), and they need fixing before the thesis defense and before more real classes use it. The judge also ignores each problem's displayed time limit (it hardcodes 20s). Students are told "1s" while the judge allows 20 times that.

## What Changes

- **Contest submission integrity**: `createSubmission` stops spreading client input into the insert. It accepts only `{ contestId, problemId, code, language }`. The server derives `questionLetter` and verifies that:
  - the problem belongs to the contest,
  - the contest is published and has started,
  - the language is valid,
  - the code is within a size cap.

  **BREAKING** (internal): the `useCreateSubmission` input type changes.
- **Practice submission integrity**: `createProblemSubmission` only accepts problems the user can see (published, or their own draft). The same code size cap and language check apply.
- **Contest problem authorization**:
  - `removeProblemToContest` (renamed `removeProblemFromContest`) requires the contest owner and a contest that hasn't started.
  - `addProblemToContest` rejects other users' draft problems and contests that have already started.
- **Hidden test redaction**: submission reads return the judge report redacted for the viewer. For a failure on a non-sample test, practice and contest viewers see only the verdict and test number. Lesson exercises follow the lesson's `showOutputs` toggle for expected output. Only the problem's owner sees the full report. Applies to:
  - `getProblemSubmissions`
  - `getContestSubmissions`
  - `getExerciseSubmissions`
  - `getUserSubmissions`
  - `exportContestData`
- **Field allowlists on updates**: `updateProblem` and `updateContest` validate input with a zod allowlist instead of spreading `Partial<Problem>` / `Partial<Contest>`. `status`, `createdBy`, `code`, `slug` and `id` can no longer be written. Contest date and problem-list edits are rejected on the server once a published contest has started.
- **Server-only helpers**: `classifyAlgorithmRequirement` and `resolvePendingConstraintClassifications` move out of `"use server"` files into a `server-only` module, so they stop being callable from the browser.
- **No email leaks**: `getProfile`, `getUserByUsername` and every submission query that joins `user` select an explicit public column set (never `email`).
- **AI rate limiting**: a per-user, Postgres-backed limit on AI actions:
  - `getAIHelp`
  - `reviewProblem`
  - `generateProblemNarrative`
  - `suggestProblemTags`
  - `generateReferenceSolution`

  A rejected call returns a localized `RATE_LIMITED` action failure.
- **Minor**: `getContestBySlug` hides drafts from non-owners. The AI `locale` input is clamped to `en`/`br`.
- **Judge enforces problem time limit**: the judge reads `problem.time_limit_ms` and applies it to the run step, scaled per language. Compilation moves to a separate step with its own fixed limit, run once per submission instead of once per test case.

## Capabilities

### New Capabilities
- `server-action-security`: authorization, input allowlisting, server-only helpers, public-user column projection, and AI rate limiting rules that every server action must follow.
- `submission-feedback-visibility`: what part of a judge report each viewer may see (problem owner, contest owner, student; practice, contest, lesson exercise; sample vs hidden test).
- `judge-time-limits`: the judge enforces the problem's configured time limit on execution, separately from compilation.

### Modified Capabilities
- `problem-workspace`: in the Results tab, the submission details view shows the failing test's input/output only when the viewer may see it (a sample test, or they own the problem).
- `contest-lifecycle`: published-contest editing restrictions are enforced on the server, not only disabled in the UI. They cover dates and the problem list (add, remove, reorder).

## Impact

- **web server actions**:
  - `lib/actions/problems/{create-submission,create-problem-submission,update-problem,get-submissions}.ts`
  - `lib/actions/contest/{remove-problem.tsx→remove-problem.ts,add-problem,update-contest,get-submissions,export-contest,get-contest-by-id}.ts`
  - `lib/actions/lessons/{get-exercise-submissions,classify-algorithm-requirement,resolve-pending-constraint-classifications}.ts`
  - `lib/actions/{get-profile,get-user-by-username,get-user-submissions,get-ai-help}.ts`
  - `lib/actions/problems/{review-problem,generate-problem-narrative,suggest-problem-tags,generate-reference-solution}.ts`
- **web new modules**: `lib/judge-report.ts` (pure redaction, unit-tested), `lib/rate-limit.ts`, `lib/public-user.ts`, `lib/constraints/` (server-only classifier), and the `server-only` dependency.
- **web hooks/UI**: `hooks/use-create-submission.tsx`, `hooks/use-remove-problem.tsx`, the contest `upload.tsx` payload, and the results/submission-list components (they must render redacted reports). New i18n keys in `messages/{en,br}.json` for `RATE_LIMITED` and the redacted-test messages.
- **DB**: a new migration adding an `ai_usage` table (user, feature, created_at). No change to `submission`/`problem` columns.
- **judge**:
  - `src/db.rs` (also selects `time_limit_ms`)
  - `src/models.rs` (`Problem` gains `time_limit_ms`)
  - `src/main.rs` (`grade` uses it)
  - `src/runner.rs` and `src/isolate.rs` (separate compile step, fractional/ms limits)

  `models.rs` enums are unchanged.
- **Behavior visible to users**:
  - Students stop seeing hidden-test input/expected/actual/stderr.
  - Submissions in some languages that relied on the 20s budget may now get TLE.
  - AI buttons can return a "try again later" message.
