## Why

Problem authoring is entirely manual today: a professor types the title, description, difficulty, and every input/output pair by hand in the edit workspace, and publish only checks that fields are non-empty (see `problem-lifecycle`'s "Publish validation" requirement) — it never checks that the declared outputs are actually correct for the declared inputs. A single typo in an expected output silently blocks every correct student solution after publish, with no way to catch it beforehand. Since the platform's whole judging pipeline (Docker sandbox execution against declared I/O) already exists for student submissions, the same mechanism can validate a problem before it's exposed to students.

## What Changes

- Add a reference-solution field to the problem edit workspace: professor pastes code + picks a language for their own correct solution to the draft problem.
- Add a "Validate" action that runs that reference solution against the problem's current declared input/output pairs through the existing judge sandbox, and reports pass/fail per test case (including mismatched expected-vs-actual output) back in the edit workspace.
- Validation runs are recorded in a new `problemValidation` table, kept fully separate from the student-facing `submission` table — they must never appear in leaderboards, submission history, or contest exports.
- **Modify `problem-lifecycle`'s "Publish validation" requirement**: publishing SHALL additionally require a passing validation run against the problem's *current* I/O set. Editing any input or output after a passing validation invalidates it (marks it stale) and re-blocks publish until re-validated.
- Judge gains a second, minimal listen path for validation runs (new table/notify channel), hand-synced with the new Drizzle schema the same way `judge/src/models.rs` is already hand-synced with `web/drizzle/schemas/` today.

Out of scope: AI-assisted problem drafting (generating description/I-O/reference code), solution-constraint enforcement (nested-loop limits, "must use Dijkstra" checks), and any change to the `learning-roadmap`/lesson system. These are separate, later proposals.

## Capabilities

### New Capabilities
- `problem-io-validation`: reference-solution input, running it through the judge sandbox against a draft problem's declared I/O, per-test pass/fail reporting, staleness tracking when I/O changes after a pass.

### Modified Capabilities
- `problem-lifecycle`: "Publish validation" requirement gains a precondition — a fresh (non-stale) passing validation run is required before a draft can transition to `published`, in addition to the existing non-empty-field checks. Bulk import (which bypasses the draft flow entirely) is unaffected.

## Impact

- **Schema**: new `problemValidation` table in `web/drizzle/schemas/` (problemId, code, language, status, per-test results, createdAt) + a Drizzle migration.
- **Server actions**: new action to trigger a validation run (`lib/actions/problems/`), modify `publishProblem` to check for a fresh pass.
- **Hooks/UI**: new hook (React Query) for triggering/polling validation; new UI in `problems/_components/workspace/edit.tsx` (or a new tests/validation sub-tab) for reference solution input, language select, Validate button, per-test results, and Publish-button gating with a "stale — re-validate" state.
- **Judge (Rust, separate repo)**: needs to know about `problemValidation` rows — either listens on a second `pg_notify` channel or polls the new table via its existing sweep fallback. `judge/src/models.rs` needs a hand-synced counterpart. Full judge-side implementation is scoped in design.md/tasks.md but may land as a follow-up PR in `judge/` by whoever owns that side.
- **No changes** to `submission`, leaderboards, contest exports, or the roadmap/lesson system.
