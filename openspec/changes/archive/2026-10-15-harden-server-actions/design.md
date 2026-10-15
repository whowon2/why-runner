## Context

`web` uses Next.js server actions as its whole API. Each export of a `"use server"` module becomes a POST endpoint that anyone can call with arbitrary JSON-serializable arguments, regardless of the TypeScript types the hooks use. An audit found four patterns:

1. **Spread-from-client writes**:
   - `createSubmission` does `.values({ ...input, userId })` with `input: $inferInsert`.
   - `updateProblem` and `updateContest` do `.set({ ...input.problem })` / `.set({ ...input.contest })`.
2. **Missing authorization**: `removeProblemToContest` (`remove-problem.tsx`) has no session check.
3. **Accidental endpoints**: `classifyAlgorithmRequirement` and `resolvePendingConstraintClassifications` sit in `"use server"` files, so they are public, and the first is a free LLM proxy.
4. **Over-fetching**:
   - The judge's `JudgeReport.failure_details` (input/expected/actual/stderr of the first failing test, hidden or not) is returned unchanged by every submission read.
   - `with: { user: true }` and the profile lookups return `email`.

Separately, `judge/src/main.rs:331` hardcodes `let time_limit = 20;`. Each test case also runs compile and execute in one isolate box (`compile_and_run_command`), so compile time counts against the limit and the compiler runs once per test.

Constraints:
- No Redis. The web app runs serverless (Vercel), so in-memory state isn't shared across instances.
- The DB schema is shared with the Rust judge without a common definition; enums are synced by hand.
- Error text thrown from actions is hidden in production; user-facing failures go through the `ActionResult`/`fail(code)` pattern in `lib/action-result.ts`.
- Deadline: thesis defense. Prefer small, mechanical, testable changes.

## Goals / Non-Goals

**Goals:**
- Close every exploitable path found in the audit, and make the safe pattern (explicit fields, explicit columns, owner checks) the obvious default for future actions.
- Hidden tests stay hidden even when actions are called directly.
- AI cost can't be run up by a single user or by anonymous callers.
- The judge enforces the time limit the UI displays.

**Non-Goals:**
- Migrating *all* thrown errors to `ActionResult` codes. Only the failures this change introduces or touches (`RATE_LIMITED`, `CODE_TOO_LARGE`, `CONTEST_NOT_STARTED`, `CONTEST_STARTED`) use codes. The broader migration is a separate change.
- Enforcing `memory_limit_mb`. The judge uses `RLIMIT_AS` caps (128 MiB default, 2 GiB for the JVM) that don't map cleanly to the displayed limit. Tracked as an open question.
- Letting authors edit time/memory limits in the problem form (no form fields exist today).
- Security headers/CSP, email verification, password reset: separate changes.
- Redacting what the LLM sees. AI help still receives the full report on the server. See Risks.

## Decisions

### D1. Explicit input schemas per mutating action (zod), never spreads
Each mutating action declares a zod object with only the fields the client may set, and uses `.strip()` (zod's default) so unknown keys are dropped silently. Using `.strict()` would break any hook still sending extra fields during the transition. The database write builds its values object from parsed fields plus server-derived ones (`userId`, `status`, `slug`, `codeSize`, `questionLetter`).
- *Alternative*: a deny-list (`delete input.status`). Rejected because it fails open whenever a new column is added.
- `updateProblem`'s `tags` validation moves into the schema. The slug is still regenerated on the server when the title changes.

### D2. `questionLetter` derived on the server
`createSubmission` looks up `problemOnContest` for `(contestId, problemId)`. A missing row means the problem isn't in the contest, so the action rejects. The letter is `letters[order]`, the same function the standings use. This also stops the client from forging a letter that poisons `user_on_contest.answered` (the judge appends the submission's letter on PASS).

### D3. One pure redaction function, applied in every read path
`lib/judge-report.ts` exports:
```
redactReport(raw: string | null, ctx: {
  viewerIsProblemOwner: boolean;
  exampleCount: number;
  kind: "practice" | "contest" | "exercise";
  showOutputs?: boolean;      // exercise only
  viewerIsLessonOwner?: boolean;
}): string | null
```
It parses `JudgeReport` JSON, applies the rules in `submission-feedback-visibility`, and re-serializes. It's pure (no DB access), so it's covered by `bun test lib`. It's called by:
- `getProblemSubmissions`
- `getContestSubmissions`
- `getExerciseSubmissions`
- `getUserSubmissions`
- `exportContestData`

Each of these already loads, or can cheaply join, `problem.createdBy` and `problem.exampleCount`. Redacted `failure_details` keep `index` and gain `redacted: true`. Of the input/expected/actual/error fields, only those the viewer may see are kept. The verdict kind is derived on the server from the fields before stripping:
- compile error: `error` starts with "Compilation Error"
- TLE: actual is "Execution timed out"
- runtime error: `error` is set
- wrong answer: otherwise

It's stored as `failure_kind`, so the UI can render a localized "Wrong answer on test N" without guessing.
- *Alternative*: change the judge to write a public report and a private report. That's cleaner long-term, but needs a schema change, a judge change, and backfilling old rows. Read-time redaction protects existing rows immediately and keeps the judge untouched for this concern. It can be revisited later.
- *Why redact `actual` and `stderr` too*: a student can print the input to stdout or stderr and read it back. Codeforces/ICPC show only the verdict on hidden tests for the same reason.
- *Contest owner is treated as a student* unless they created the problem. Anyone can create a contest, so granting contest owners the full report would leak the hidden tests of any public problem.

### D4. Server-only helpers live outside `lib/actions/`
`classifyAlgorithmRequirement` and `resolvePendingConstraintClassifications` move to `lib/constraints/classify.ts`, which has no `"use server"` and starts with `import "server-only"` (new dependency, tiny). `getExerciseSubmissions`, which is a server action and authenticated, imports from there. Rule of thumb, recorded in `web/CLAUDE.md`: *every export in `lib/actions/` is a public endpoint*.

### D5. Public user projection constant
`lib/public-user.ts` exports `publicUserColumns` (a drizzle `columns` object). Every `with: { user: ... }` and the profile lookups use it. The onboarding page reads the current user's own row through `getCurrentUser`, not `getProfile`. Contest export keeps its explicit `email` select (owner-only, intentional for teachers).

### D6. Postgres-backed sliding-window AI rate limit
A new table `ai_usage (id uuid pk, user_id text fk → user, feature text, created_at timestamptz default now())` with an index on `(user_id, feature, created_at)`. `lib/rate-limit.ts` provides `consumeAiQuota(userId, feature)`:
1. Count the rows in the window.
2. If the count is at or over the limit, return `fail("RATE_LIMITED", { retryAfterSeconds })`.
3. Otherwise insert a row and return ok.

Limits are code constants per feature:

| Feature | Limit |
|---|---|
| ai-help | 10 / 10 min |
| problem-review | 10 / 10 min |
| narrative | 10 / 10 min |
| tags | 20 / 10 min |
| reference-solution | 10 / 10 min |

- *Alternatives*:
  - In-memory LRU: not shared across serverless instances.
  - Upstash/Redis: a new paid dependency for a thesis app.
  - Reusing `submission` counting, which is how submission rate limits work today: doesn't apply, since AI calls have no row of their own.
- Count-then-insert is not atomic, so concurrent bursts can exceed the limit by a few. That's acceptable; this is a cost guard, not a security boundary. Old rows are pruned opportunistically (`DELETE … WHERE created_at < now() - interval '1 day'` on about 1% of calls).
- The AI actions change their return type to `ActionResult<T>`, and their hooks use `unwrap`. `isActionError(e, "RATE_LIMITED")` drives a localized toast.

### D7. Judge: compile once, then run with the problem's limit
- `Problem` gains `time_limit_ms: i32`, and `db.rs` selects it.
- `runner` is split into `compile(code, lang) -> Result<CompiledArtifact, CompileError>` and `execute(artifact, input, limits)`. Compiled languages (C, C++, Rust, Java) compile in their own isolate box, with a fixed 30s compile limit and the language's existing memory cap. The artifact is copied out to a temp dir and mounted read-only into each execution box.
- Python and Portugol keep the single run step. Portugol compiles internally on every run and can't be split.
- Effective run limit per test:
  `limit_s = time_limit_ms/1000 × factor[lang] + allowance[lang]`

  | Language | factor | allowance |
  |---|---|---|
  | C / C++ / Rust | 1 | 0 |
  | Java | 2 | 0.5s (JVM start) |
  | Python | 3 | 0 |
  | Portugol | 2 | 3s (internal javac + JVM) |

  Wall time = `limit_s × 2 + 1`.
- `IsolateLimits.time_secs` becomes `f64`; isolate accepts fractional `--time`.
- The TLE message reports the effective limit.
- *Alternative*: keep combined compile+run and just add a compile allowance. Rejected because it still recompiles for every test, and judge throughput is the bottleneck on a single Fly machine. Compiling once is a big speed win on its own.
- *Alternative*: honor the limit with no per-language factor. Rejected; it would make Python and Portugol unusable at 1s defaults, and teaching problems commonly use those.

### D8. Contest started rules enforced in actions
A shared helper `assertContestEditable(contest, now)` is used by:
- `updateContest`, when the input changes `startDate` or `endDate`
- add, remove, and reorder problem

It returns `fail("CONTEST_STARTED")` for a published contest whose `startDate` is past. Draft contests stay fully editable.

## Risks / Trade-offs

- [Existing passing submissions in Python/Portugol might TLE under the new limits] → The factors and allowances are deliberately generous. Before deploying, rerun the `problems.json` reference solutions through the judge locally and tune them. Past verdicts are not re-judged.
- [Read-time redaction can be forgotten in a new read path] → A single helper, a CLAUDE.md note, and a test that runs `redactReport` over a fixture for each context. Future work: write a public report from the judge (D3 alternative).
- [AI help still receives hidden tests, so a "pinpoint" hint could paraphrase the expected output] → The prompt already tells the model not to reveal answers. Accepted for now; noted as an open question.
- [`server-only` import in shared modules breaks client bundles if imported by mistake] → That is the point: the build fails loudly.
- [Return type change of AI actions ripples to hooks] → Five hooks, mechanical, covered by `bun lint` / tsc.
- [Compile-artifact handoff between isolate boxes adds filesystem steps] → Keep it to one temp dir per submission, cleaned in a `Drop` guard. The judge's integration test covers a C submission with multiple tests.

## Migration Plan

1. Web DB migration for `ai_usage` (`bun db:generate` → `bun db:migrate`). It's additive; rolling back only means dropping the table.
2. Deploy web. All action changes are backward compatible with the deployed judge.
3. Deploy the judge (Fly). It needs no DB change, because `time_limit_ms` already exists with default 1000. Rollback: redeploy the previous image.
4. Re-run reference solutions for the seeded problems after the judge deploy, and tune the factors if needed.

## Open Questions

- Should the memory limit shown in the UI be changed to match what the judge actually enforces (128 MiB / 2 GiB JVM), or should the judge enforce `memory_limit_mb`? (Separate change.)
- Should AI help on hidden-test failures withhold the expected output from the prompt in `concept`/`hint` levels?
- Should participant emails be visible to contest owners in the participants list, or only in the export? Today both. This change keeps the export only and drops email from `getParticipants`.
