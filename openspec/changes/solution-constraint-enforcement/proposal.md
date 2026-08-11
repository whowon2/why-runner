## Why

Problem creators today constrain only I/O correctness — a submission that produces right output via brute force passes even when the problem intends to teach a specific algorithm or technique (e.g. "must use Dijkstra", "no nested loops"). Without constraint enforcement, the judge can't grade *how* a student solved a problem, only *that* they got the right answer, which caps how rigorous algorithm-focused coursework can be on this platform.

## What Changes

- Problem creators can attach **solution constraints** to a problem: a small declarative set of rules (forbidden/required constructs — e.g. nested-loop depth cap, banned language builtins — and/or a required-algorithm classification, e.g. "must use Dijkstra").
- Passing submissions are checked against the problem's active constraints in addition to I/O correctness:
  - Structural rules (loop nesting depth, forbidden tokens/constructs) are checked via judge-side static analysis, per submission language.
  - Algorithm-requirement rules ("must use X") are checked via an AI classification pass over the submitted source, since static analysis alone can't reliably recognize algorithm intent.
- A submission that passes all test cases but violates a constraint is marked as a distinct outcome (not `PASSED`, not a normal `FAILED`/`ERROR`) so students see *why* it didn't count, separate from a wrong-answer failure.
- Constraint checks reuse the existing validation flow's separation from leaderboard/history data: constraint verdicts are computed as part of normal grading (not a separate isolated run like `problemValidation`), since they apply to real student submissions.

## Capabilities

### New Capabilities

- `solution-constraints`: authoring constraints on a problem (structural rules + algorithm-requirement rules) and grading student submissions against them, including judge-side static analysis for structural rules and AI classification for algorithm-requirement rules, with a distinct submission outcome for constraint violations.

### Modified Capabilities

- `problem-io-validation`: reference-solution validation runs must also be checked against the problem's active solution constraints, so a creator can catch a reference solution that would itself fail the constraint (e.g. their intended solution doesn't actually satisfy the "no nested loops" rule they set) before publishing.

## Impact

- **`web/`**: new `problemConstraint`-style schema (Drizzle) to persist constraint definitions per problem; edit workspace UI to author constraints; submission result UI to render the new "constraint violation" outcome distinctly from pass/fail.
- **`judge/`**: `src/models.rs` `SubmissionStatus` enum gains a new variant (kept in sync with the Drizzle enum per root `CLAUDE.md`); `process_job()` gains a post-I/O-pass step that runs structural static analysis (new judge-side module, per submission language) and, when an algorithm-requirement rule is present, calls out to an LLM for classification before finalizing the `JudgeReport`.
- **Cross-service contract**: this is the first judge-side static-analysis + AI-classification capability — today all AI calls (`getAIHelp`, `reviewProblem`, `generateProblemNarrative`) live in `web/`, and `judge/` has no LLM dependency. Adding AI classification to `judge/` needs a design decision (LLM call from Rust judge vs. web-side pre/post-processing) — deferred to design.md.
- **Scope note**: parked as the hardest of the AI-authoring backlog per project memory; depends on nothing else outstanding, but is a meaningfully larger lift than prior AI features since it touches the Rust judge, not just `web/`.
