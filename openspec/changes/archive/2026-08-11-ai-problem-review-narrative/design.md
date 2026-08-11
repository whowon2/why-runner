## Context

`web/` already has two AI-assisted authoring features to build on: `generateReferenceSolution` (draft-into-editable-field, never auto-saved) and `problem_validation` (a side table + panel wired into the same edit workspace). Both use `@google/genai` with `gemini-2.5-flash` and `env.GEMINI_KEY`, called synchronously inside a `"use server"` action with no queueing, no rate limiting, no server-side caching. This change adds two more actions to the same workspace rather than introducing new infrastructure.

## Goals / Non-Goals

**Goals:**
- Give problem authors AI-generated, actionable feedback (edge cases + description clarity) they can accept or discard per item.
- Give authors an optional AI-drafted narrative/flavor text, AoC-style, that they can edit before saving.
- Reuse existing auth/ownership, prompt-injection-defense, and draft-into-field UX conventions exactly.

**Non-Goals:**
- No edit-changelog/version-history/audit-trail (explicitly ruled out — "history" here means narrative flavor text, confirmed with user).
- No rate limiting or cost controls for the new AI calls — matches the pre-existing gap in `getAIHelp`/`generateReferenceSolution`; not introduced or fixed here.
- No auto-application of AI suggestions to the problem — every suggestion requires an explicit author action (click "Add test case", or edit-then-save the narrative).
- No narrative requirement for publish — `getMissingProblemFields` is untouched.

## Decisions

**Structured JSON output for review, not freeform text.** `reviewProblem` uses `responseMimeType: "application/json"` + `responseSchema` (Gemini structured output) so edge cases arrive as `{input, output, rationale}[]` that the UI can turn into one-click "Add test case" actions against the existing `inputs`/`outputs` `useFieldArray`. Description feedback stays a markdown string inside the same JSON object (rendered via the `ReactMarkdown` setup already used in `ai-dialog.tsx`). Alternative considered: freeform markdown like `getAIHelp` — rejected because unstructured edge-case suggestions can't be turned into real test cases without the author manually retyping them, which defeats the point.

**Narrative persisted as a plain nullable column on `problem`, not a side table.** Unlike `problem_reference_solution` (deliberately isolated because it's teacher-only and needs the `Language` enum, risking a schema circular import), narrative is student-facing content that belongs with `description` and has no enum dependency — a column keeps read paths (Task tab) a single query instead of a join. Alternative considered: separate `problem_narrative` table mirroring `problem_reference_solution` — rejected, no isolation need exists here.

**Both AI actions are ephemeral (no DB write) at generation time**, exactly like `generateReferenceSolution`. The review action never writes anything — its output only ever becomes real data if the author clicks "Add test case," which goes through the existing form state and the existing `updateProblem` save path. The narrative action returns a draft string that lands in the form's narrative field and is only persisted when the author saves the problem normally. This keeps both actions side-effect-free and reuses `updateProblem`'s existing auth/ownership/validation instead of adding a second save path.

**Prompt design continues the XML-tag "untrusted content" convention** already established in `lib/prompt.ts` for `getUserPrompt` and `getReferenceSolutionPrompt` — problem title/description/tests are wrapped in `<problem_title>`/`<problem_description>`/`<test_cases>` tags with an explicit instruction to treat their contents as data, not instructions, defending against prompt injection via user-authored problem text.

## Risks / Trade-offs

- [Structured JSON output could fail to parse or the model could return a malformed schema] → `@google/genai`'s `responseSchema` constrains output at the API level; action still wraps parsing in a try/catch and surfaces a generic error toast on failure, matching existing error handling in `use-generate-reference-solution.tsx`.
- [No rate limiting means a malicious/careless author could spam Gemini calls] → Accepted pre-existing risk, consistent with the two AI actions already shipped; not blocking this change per the design's non-goals.
- [Adding a narrative column touches a widely-used table] → Column is nullable with no default-required semantics, additive-only migration (`bun db:generate`), no backfill needed.
- [Narrative rendered as raw markdown/HTML from an LLM] → Rendered through the existing `ReactMarkdown` component already used for problem descriptions and AI-help output, which is already trusted to sanitize/escape in this codebase — no new rendering surface introduced.

## Migration Plan

1. Add `narrative` column via `bun db:generate` + `bun db:migrate` (or `db:push` in dev) — additive, no data migration needed, nullable.
2. Ship server actions, hooks, and UI in the same change; no phased rollout required since the feature is fully additive and opt-in per problem.
3. No rollback complexity beyond dropping the column and removing the UI entry points if ever needed.

## Open Questions

- Exact placement of the narrative field in the edit form (new tab vs. section within the existing Edit tab) and exact file for the student-facing Task tab render point — left for implementation to resolve against the current `create.tsx`/Task tab structure, per the approved plan.
