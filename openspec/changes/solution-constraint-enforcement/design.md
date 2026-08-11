## Context

Grading today is purely I/O-based: `judge/src/runner.rs` runs submitted code per test case and compares stdout. There is no notion of *how* the code got the answer. The backlog (see project memory) calls this the hardest of three planned AI-authoring features specifically because it's the first capability requiring judge-side (Rust) static analysis and the first LLM call originating outside `web/`. All existing AI calls (`getAIHelp`, `reviewProblem`, `generateProblemNarrative`) are Next.js server actions calling Gemini directly — `judge/` has zero AI/LLM dependency today and is deliberately a small, dependency-light Rust worker (`judge/CLAUDE.md`: "Three files, straight-line flow, no framework").

Two constraint types have different verification costs:
- **Structural rules** (nested-loop depth cap, forbidden constructs/builtins) are mechanically checkable via static analysis over the submitted source, per language.
- **Algorithm-requirement rules** ("must use Dijkstra") aren't reliably detectable by static analysis — the same shortest-path result can come from Dijkstra, Bellman-Ford, or a brute-force BFS variant that only looks like Dijkstra. This needs semantic judgment, i.e. an LLM classification pass over the source (+ problem context).

## Goals / Non-Goals

**Goals:**
- Let a creator declare structural constraints and/or a required-algorithm constraint on a problem.
- Grade real student submissions against active constraints, in the same pipeline that already grades I/O, without touching leaderboard/history semantics for I/O-passing-but-constraint-violating runs.
- Keep the AI classification call cheap and rare: only run it on submissions that already pass all I/O test cases (no point classifying wrong-answer code).
- Keep `judge/`'s sandboxed-execution core untouched; add constraint checking as a distinct post-I/O-pass phase.

**Non-Goals:**
- No general-purpose plagiarism/similarity detection.
- No arbitrary user-authored static-analysis rule language (DSL) in v1 — a fixed, small catalog of structural rule *types* (e.g. `max_loop_nesting_depth`, `forbidden_constructs: [...]`) with parameters, not free-form rules.
- No support for algorithm-requirement classification on languages/constructs the LLM can't reasonably reason about from source alone (scope this to the same submission languages already supported).
- Not re-litigating `problem-io-validation`'s isolation model — constraint checks for validation runs reuse that flow's existing isolation, they don't create a second validation mechanism.

## Decisions

### 1. Where does the AI classification call happen: `judge/` (Rust) or `web/` (Next.js)?

**Decision: `web/` makes the LLM call, not `judge/`.**

`judge/` stays dependency-light and network-less by design (sandboxes run with `--network none`; the worker itself only talks to Postgres). Adding an outbound LLM HTTP call from the Rust worker means giving the judge process itself network egress and an API key, which is a bigger blast-radius change to a component whose entire threat model currently assumes "runs untrusted code, but the worker process itself is a closed box." Instead:

- `judge/` does structural static analysis in-process (pure computation, no network) and writes a `constraintCheck` result alongside the normal `JudgeReport` when the submission has active constraints — this covers structural rules end-to-end in Rust.
- For algorithm-requirement rules, `judge/` writes the *submitted source* (already has it) and marks the submission `PENDING_CONSTRAINT_CLASSIFICATION` (or similar) instead of finalizing straight to `PASSED`, once I/O and structural checks succeed. A `web/` server action (following the existing `getAIHelp`/`reviewProblem` pattern) picks up rows in that state, calls Gemini with the problem's algorithm requirement + submitted source, and writes the final verdict + updates submission status.

Alternatives considered:
- *LLM call directly from judge/Rust*: rejected — network egress + API key in the sandboxing worker, against its "no framework, small surface" design; also duplicates prompt/response-schema logic that already exists in `web/` for the other two AI features.
- *Web does structural static analysis too, judge only executes*: rejected — static analysis needs the exact submitted source in the same place it's compiled/run, and duplicating per-language parsing logic in TypeScript when Rust already touches the source per-language is wasted work; also loses the "judge is where language-specific submission logic lives" boundary already established.

### 2. New submission status vs. a side-table verdict

**Decision:** add distinct `SubmissionStatus` variants (`CONSTRAINT_VIOLATION` for structural failures resolved synchronously in judge; `PENDING_CONSTRAINT_CLASSIFICATION` as a transient state before the AI verdict lands) rather than layering a separate `constraintCheck` table that a passing/failing submission's UI has to join against silently.

Alternatives considered: a side-table only, with `submission.status` staying `PASSED`/`FAILED` as today — rejected because the proposal explicitly wants "a distinct outcome... not PASSED, not a normal FAILED", and burying that in a join a UI could forget to check risks silently treating constraint-violating code as passing (leaderboard risk). A first-class status makes the state impossible to ignore at every callsite that currently switches on `submission.status` (leaderboard credit in `db.rs`'s `update_submission_result`, submission history UI, etc.), and per `CLAUDE.md`, `Language`/`SubmissionStatus` must already be hand-synced between Rust and Drizzle enums — this is one more variant added to a process that already exists.

### 3. Constraint scope: per-problem, not per-submission-language

**Decision:** constraints are declared once per problem and apply uniformly across every language a student may submit in. Structural rule checking is per-language (loop-nesting analysis for Python looks different than for C), but the *rule itself* ("no nested loops deeper than 1") is language-agnostic from the creator's point of view.

### 4. Reference-solution validation reuses constraint checks

Per proposal's modified `problem-io-validation` capability: a `problemValidation` run, when the problem has active constraints, runs the same structural analysis + (if needed) AI classification against the reference solution before the run can be marked passed, so creators can't publish a problem whose own reference solution violates the constraint they set.

## Risks / Trade-offs

- **[Risk]** AI classification is probabilistic — false positives/negatives on "did this use Dijkstra" are inherent to LLM judgment, unlike deterministic I/O/static checks. → Mitigation: surface the classification as advisory-but-blocking with a visible rationale (mirroring `reviewProblem`'s structured-feedback pattern) so students/creators can see *why*, and treat it as a v1 known limitation, not solved perfectly.
- **[Risk]** New transient `PENDING_CONSTRAINT_CLASSIFICATION` status adds a second async hop (judge → web → LLM → DB) after the existing judge-only grading loop, increasing latency-to-final-status for constrained problems specifically. → Mitigation: scope AI classification to only run after I/O + structural checks already pass, keeping the extra hop rare (most submissions never reach it) and off the hot path for ungraded/failing code.
- **[Risk]** Every judge-side static analyzer is per-language, per-rule-type maintenance surface (loop-depth analysis in C is not the same code as in Python) — this can sprawl. → Mitigation: v1's fixed, small rule catalog (Non-Goals) caps this instead of a general rule DSL.
- **[Trade-off]** Splitting the check across two services (structural in Rust, algorithmic in TypeScript) means a single "constraint result" is assembled from two different write paths instead of one. → Accepted: matches existing architectural boundary (judge owns execution/source-level work, web owns LLM calls) rather than forcing one service to do work it wasn't built for.

## Open Questions

- Exact catalog of v1 structural rule types (max loop nesting, forbidden builtins/keywords, banned recursion?) — needs a decision pass with the creator-facing UI design, not blocking this design doc.
- Should `PENDING_CONSTRAINT_CLASSIFICATION` submissions show as "pending" or as a provisional "passed" to the student while classification runs, given it may take several seconds for the LLM round-trip?
- Should contest leaderboard credit (`update_submission_result`'s `user_on_contest.answered` write) wait for constraint classification, or credit on I/O pass and revoke on violation? Revoking after credit has awkward leaderboard-consistency implications — leans toward waiting, but needs confirmation against contest-lifecycle expectations.
