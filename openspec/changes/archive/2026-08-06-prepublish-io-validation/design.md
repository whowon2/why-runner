## Context

Problem authoring (`web/app/[locale]/problems/_components/create.tsx` + `workspace/edit.tsx`) is a plain form: title, description, difficulty, and raw input/output text pairs typed by hand. `publishProblem` (backing `problem-lifecycle`'s "Publish validation" requirement) only checks non-emptiness — it never executes anything. The only place code execution happens today is the student submission pipeline: `web` inserts a `submission` row and calls `pg_notify('new_submission', id)`; `judge` (separate Rust worker, own repo checkout under `judge/`) claims it, runs it in a network-less Docker sandbox per test case, writes status/output back. This is a cross-service change: the web-side schema/UI/actions can ship independently, but the judge side must also be taught about the new table, and the two are hand-synced (`judge/src/models.rs` enums vs `web/drizzle/schemas/` Drizzle enums — no shared schema source, per root CLAUDE.md).

## Goals / Non-Goals

**Goals:**
- Let a professor confirm their declared I/O is actually correct before students can see it, using the same sandboxed execution judge already provides.
- Guarantee validation runs can never leak into student-facing data (leaderboards, submission history, contest exports, AI-help-on-failure).
- Detect when a passing validation goes stale because the professor kept editing I/O after validating.

**Non-Goals:**
- Validating in every language the problem accepts submissions in — one reference-language pass is sufficient, since grading is a stdin/stdout text diff independent of the reference implementation's language.
- Any static analysis of the reference solution's complexity/algorithm (that's the separate "solution-constraint enforcement" proposal).
- Changing how student submissions are graded, stored, or displayed.

## Decisions

### Separate `problemValidation` table, not `submission` + a `kind` column
Reusing `submission` would mean every existing read site (leaderboard queries, `get-user-submissions`, `get-submissions`, contest management exports, the AI-help dialog) has to remember to filter `kind = 'attempt'`. Missing one filter surfaces as a real bug visible to students (a professor's scratch run showing up as a leaderboard entry or submission history row). A dedicated `problemValidation` table makes that class of bug structurally impossible — nothing that reads `submission` needs to change at all. Cost: judge needs a second, small listen path. Accepted given the safety win.

### Staleness via content hash, not a boolean flag
`problemValidation` stores a hash of the exact input/output arrays it validated against (e.g. a hash over `JSON.stringify({inputs, outputs})`). On every load of the edit workspace, the UI/action compares that stored hash to a hash of the *current* form/persisted I/O. Mismatch ⇒ stale, independent of whether the professor "touched" a flag — this survives page reloads, multi-tab editing, and doesn't require wiring invalidation into every input's onChange handler. A simple `isStale: boolean` column would need explicit invalidation logic scattered across every I/O-mutating code path (add/remove/edit test case) and would drift out of sync if any path is missed.

### One passing validation row is sufficient to unblock publish (not "most recent run passed")
Publish checks "does a `problemValidation` row exist for this problem whose I/O-hash matches the current I/O-hash and whose status is PASSED" — not "was the last run a pass." This means a professor can experiment with a failing reference-solution edit without losing their earlier passing state, as long as they haven't also changed the I/O since. Keeps the mental model simple: validation is keyed to *I/O content*, not to a linear run history.

### Judge integration: reuse the sweep-fallback pattern, add a second `pg_notify` channel
`judge/src/main.rs` already has a periodic sweep as a fallback to `LISTEN`/`NOTIFY` for `submission`. The same shape applies here: web inserts a `problemValidation` row with `status = PENDING` and calls `pg_notify('new_validation', id)`; judge adds a second `LISTEN new_validation` plus a periodic sweep over `problemValidation WHERE status = 'PENDING'`. Judge's execution/grading core (Docker sandbox run of one code+language against N input/output pairs, per-test result) is reused as-is — only the claim/notify/write-back plumbing is duplicated for the new table. This is a `judge/` repo change; scoped here but implementable independently once the web-side contract (table shape) is fixed.

## Risks / Trade-offs

- **[Risk]** Judge-side work lands late (different owner/repo), leaving the web UI half-built with no backend to call. → **Mitigation**: land web-side schema + actions + UI behind the assumption the table/channel contract is fixed now (this design.md is that contract); judge PR can follow independently since it only adds a new listen path, doesn't touch existing `submission` handling.
- **[Risk]** Hash-based staleness silently breaks if input/output arrays are compared/hashed order-sensitively but the UI reorders pairs without content changes. → **Mitigation**: hash the arrays in their stored (positional) order, matching how `inputs`/`outputs` are already positionally paired in `problem` — no reordering UI exists today, so this is consistent with current behavior, not a new assumption.
- **[Risk]** A professor validates with a reference solution that's subtly wrong in a way that happens to match their (also wrong) expected outputs — validation passing doesn't guarantee correctness, only *consistency* between reference code and declared I/O. → **Mitigation**: out of scope to solve here (would need e.g. a second independent reference or human review); note this limitation in the capability's spec so it isn't oversold as a correctness guarantee.
- **[Trade-off]** Only one reference language is validated even though the problem may accept 6. Accepted per Non-Goals — output text-diff grading makes this safe.

## Migration Plan

1. Add `problemValidation` Drizzle schema + migration (additive, no changes to existing tables).
2. Ship web-side action/hook/UI behind the existing draft-only edit workspace (no exposure to students; drafts are already creator-only per `problem-lifecycle`).
3. Modify `publishProblem` to add the fresh-pass check — additive precondition, doesn't change existing field-emptiness checks.
4. Judge PR (separate repo/owner) adds the second listen path; until it lands, "Validate" runs will sit `PENDING` — UI should show a clear pending/waiting state rather than erroring, so partial rollout doesn't look broken.
5. No rollback complexity beyond dropping the new table/column checks — nothing existing is touched.

## Open Questions

- Should validation results be visible to the problem's *other* contest-owners (if problems are ever co-authored), or strictly to `createdBy`? Assumed strictly creator-only for now, matching draft visibility rules.
- Exact judge-side notify channel name / whether it reuses the sweep loop's existing polling interval or needs its own — left to the judge-side implementer, noted as a contract point in tasks.md.
