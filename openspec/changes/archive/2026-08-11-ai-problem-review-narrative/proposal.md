## Why

Problem authors currently write and publish problems with no second pair of eyes — nothing flags missing edge cases or an unclear description, and problems are plain technical statements with no engaging framing, unlike Advent of Code or themed competitive-programming problems. The codebase already has a working pattern for this (`generateReferenceSolution`: Gemini draft → editable field → human reviews and saves) that can be extended to cover authoring quality and narrative flavor without new infrastructure.

## What Changes

- New "Review with AI" action on the problem edit workspace: calls Gemini for structured feedback — markdown critique of description clarity plus a list of suggested edge-case test cases (input/output/rationale), each addable to the problem's test cases with one click. Nothing is auto-applied; the author reviews and accepts.
- New "Generate Narrative with AI" action: calls Gemini for a short AoC-style themed story framing the problem, drafted into an editable narrative field for the author to accept/edit.
- New optional `narrative` field on `problem`, saved through the existing problem-update action. Never required for publish.
- Student-facing problem page (Task tab) renders the narrative above the technical description when present, styled distinctly as flavor text.

## Capabilities

### New Capabilities
- `ai-problem-review`: AI-assisted authoring review — structured description feedback and suggested edge-case test cases, drafted for the problem author to accept or discard, never auto-applied.
- `problem-narrative`: AI-assisted generation and storage of an optional themed narrative/flavor text for a problem, editable and saved by the author.

### Modified Capabilities
- `problem-workspace`: Task tab SHALL display the problem's narrative (when set) above the technical description.

## Impact

- Affected code: `web/lib/actions/problems/` (two new server actions), `web/lib/prompt.ts` (new system instructions/prompt builders), `web/hooks/` (two new mutation hooks), `web/app/[locale]/problems/_components/` (new review panel, narrative field, Task tab rendering), `web/drizzle/schemas/problems.ts` (+ migration for `narrative` column), `web/messages/{en,br}.json`, `web/CLAUDE.md`.
- No new external dependencies — reuses the existing `@google/genai` client and `GEMINI_KEY`.
- No breaking changes; `narrative` is nullable and optional at every layer.
