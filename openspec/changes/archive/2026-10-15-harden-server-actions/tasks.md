## 1. Shared foundations

- [x] 1.1 Add `server-only` dependency to `web/package.json`
- [x] 1.2 Create `web/lib/public-user.ts` exporting `publicUserColumns` (id, name, username, image, coverImage, coverDim, bio, location, website, createdAt)
- [x] 1.3 Create `web/lib/submission-limits.ts` with `MAX_CODE_LENGTH = 64 * 1024` and a `languageSchema` (zod enum from `Language.enumValues`)
- [x] 1.4 Add a `clampLocale(locale): "en" | "br"` helper (e.g. in `web/lib/prompt.ts`) and use it in `getAIHelp` and `getUserPrompt`
- [x] 1.5 Add new i18n keys to `messages/en.json` and `messages/br.json`: `RATE_LIMITED` (with `{seconds}`), `CODE_TOO_LARGE`, `CONTEST_NOT_STARTED`, `CONTEST_STARTED`, and hidden-test verdict lines (wrong answer / runtime error / time limit / constraint violation "on test {n}")

## 2. Submission integrity

- [x] 2.1 Rewrite `lib/actions/problems/create-submission.ts`: zod input `{ contestId, problemId, code, language }`. Check that the contest is published, the user is an accepted participant, and the contest has started (`CONTEST_NOT_STARTED`). Load `problemOnContest` for `(contestId, problemId)` (reject if missing) and derive `questionLetter = letters[order]`. Enforce `MAX_CODE_LENGTH` (`CODE_TOO_LARGE`). Insert an explicit field list with server-computed `codeSize`. Return `ActionResult`.
- [x] 2.2 Update `hooks/use-create-submission.tsx` input type and `unwrap`; update `contests/_components/tabs/problem/upload.tsx` to stop sending `questionLetter`, and show localized toasts for the new codes
- [x] 2.3 `create-problem-submission.ts`: require the problem to be published or owned by the current user; validate language and `MAX_CODE_LENGTH`
- [x] 2.4 `create-exercise-submission.ts`: apply the same language and `MAX_CODE_LENGTH` checks

## 3. Contest authorization

- [x] 3.1 Add an `assertContestEditable` helper (published + `startDate` passed → `fail("CONTEST_STARTED")`)
- [x] 3.2 Rename `remove-problem.tsx` → `remove-problem.ts` and `removeProblemToContest` → `removeProblemFromContest`; add `getCurrentUser`, an owner check, and `assertContestEditable`; update `hooks/use-remove-problem.tsx`
- [x] 3.3 `add-problem.ts`: zod input `{ contestId, problemId }` (no spread); reject draft problems not owned by the current user; apply `assertContestEditable`
- [x] 3.4 `reorder-problems.ts`: replace the inline started check with `assertContestEditable`
- [x] 3.5 `getContestBySlug`: return null for drafts unless the current user is the creator

## 4. Update allowlists

- [x] 4.1 `update-problem.ts`: a zod schema for title, description, narrative, difficulty, tags, inputs, outputs, exampleCount; build `.set()` from the parsed data only; change the `UpdateProblemInput` type accordingly
- [x] 4.2 `update-contest.ts`: a zod schema for name, description, startDate, endDate, isPrivate, aiAssistance; reject date changes via `assertContestEditable`; build `.set()` from the parsed data only; change `UpdateContestInput`
- [x] 4.3 Check that the existing callers (`problems/_components/create.tsx`, `contests/_components/tabs/settings/form.tsx`) still type-check and behave unchanged

## 5. Server-only constraint classifier

- [x] 5.1 Move `classifyAlgorithmRequirement` and `resolvePendingConstraintClassifications` into `web/lib/constraints/classify.ts` (no `"use server"`, starts with `import "server-only"`); delete the two old action files
- [x] 5.2 Update the import in `lib/actions/lessons/get-exercise-submissions.ts`
- [x] 5.3 Add a note to `web/CLAUDE.md`: every export in `lib/actions/` is a public endpoint, and server-only helpers go elsewhere

## 6. PII projection

- [x] 6.1 `get-profile.ts` and `get-user-by-username.ts`: select `publicUserColumns`
- [x] 6.2 Switch the onboarding page to the current user's own data (`getCurrentUser`) if it needs non-public fields
- [x] 6.3 Replace `with: { user: true }` with `with: { user: { columns: publicUserColumns } }` in: problems/get-submissions, contest/get-submissions, contest/get-participants, get-user-submissions, classes/get-class, and any others found with `grep -rn "user: true" lib/actions`

## 7. Judge report redaction

- [x] 7.1 Create `web/lib/judge-report.ts`: the `JudgeReport` types, `failureKind()` derivation, and `redactReport(raw, ctx)` per design D3 (keep `index`, `passed_count`, `total_tests`; add `redacted`, `failure_kind`; compile errors keep `error`)
- [x] 7.2 Add `web/lib/judge-report.test.ts` covering: owner full; sample failure full; hidden WA/RE/TLE redacted (no input/expected/actual/error); compile error keeps output; exercise with showOutputs on/off; contest owner who is not the problem owner gets redacted; null/invalid JSON passthrough
- [x] 7.3 Apply `redactReport` in `problems/get-submissions.ts` (load `problem.createdBy`, `exampleCount`)
- [x] 7.4 Apply it in `contest/get-submissions.ts` (the viewer is the problem owner only if `problem.createdBy === currentUser.id`)
- [x] 7.5 Apply it in `lessons/get-exercise-submissions.ts` (join the lesson for `showOutputs` and owner)
- [x] 7.6 Apply it in `get-user-submissions.ts` and in `contest/export-contest.ts` (the "Judge Output" column)
- [x] 7.7 Update `problems/_components/workspace/results.tsx` and `contests/_components/tabs/problem/submission-list.tsx` to render `redacted` reports as a localized "<verdict> on test N" line instead of empty input/expected blocks; also check `classes/_components/exercise-mode.tsx`

## 8. AI rate limiting

- [x] 8.1 Add an `aiUsage` table to `drizzle/schemas/` (id, userId fk cascade, feature, createdAt; index on `(userId, feature, createdAt)`); run `bun db:generate`
- [x] 8.2 Create `web/lib/rate-limit.ts` with per-feature limits and `consumeAiQuota(userId, feature)` returning `ActionResult<void>`, with opportunistic pruning
- [x] 8.3 Call it at the top of `getAIHelp`, `reviewProblem`, `generateProblemNarrative`, `suggestProblemTags`, and `generateReferenceSolution`; change their return types to `ActionResult<T>`
- [x] 8.4 Update the five hooks (`use-ai-help`, `use-review-problem`, `use-generate-problem-narrative`, `use-suggest-problem-tags`, `use-generate-reference-solution`) to `unwrap`, set `retry: retryUnlessActionError`, and show a localized `RATE_LIMITED` toast in their callers

## 9. Judge time limits

- [x] 9.1 Add `time_limit_ms: i32` to `Problem` in `judge/src/models.rs`; select it in `judge/src/db.rs`
- [x] 9.2 Make `IsolateLimits.time_secs`/`wall_time_secs` `f64` in `isolate.rs`, formatting `--time` with fractional seconds; update the existing tests
- [x] 9.3 Split `runner.rs` into `compile()` (C, C++, Rust, Java in their own box: 30s limit, artifact copied to a per-submission temp dir with a `Drop` cleanup) and `execute()` (mount the artifact read-only; Python and Portugol keep the single-step run)
- [x] 9.4 In `main.rs::grade`, compile once before the test loop (a compile error stops grading as before), compute the per-language effective limit from `time_limit_ms` (factor + allowance table, design D7), and report the effective limit in the TLE message
- [x] 9.5 `cargo test` and `cargo clippy` pass; run the reference solutions from `problems.json` through a local judge in every language and tune the factors if any correct solution TLEs — done: 29/29 judge tests pass in an isolate container (incl. trivial echo in all 6 languages at the default 1000ms); `problems.json` has no reference solutions, so re-running real solutions against prod/DB data is left for after deploy (see Migration Plan step 4)

## 10. Verification

- [x] 10.1 `bun lint`, `bun test lib`, and `bun run build` pass in `web/` — `bun test lib` 62/62, `tsc` clean, `bun run build` ok; `bun lint` still reports 4 pre-existing errors on lines this change did not touch
- [ ] 10.2 Manual exploit replays from the browser console, each now failing:
  - `createSubmission` with `status: "PASSED"`
  - `removeProblemFromContest` while signed out or as a non-owner
  - `updateProblem` with `status`/`createdBy`
  - direct call to the old classifier action id
  - `getProfile` of another user (no email)
- [ ] 10.3 Manual UI check: a practice and a contest submission failing a hidden test show "Wrong answer on test N" in en and br; failures on sample tests and compile errors still show full detail; the problem owner sees full detail
- [ ] 10.4 Exceed the AI help limit and confirm the localized toast; confirm no provider call is made (check the server log)
