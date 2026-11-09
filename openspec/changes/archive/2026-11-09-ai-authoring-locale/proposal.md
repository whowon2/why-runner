## Why

In the 2026-10-29 classroom test the teacher (lesson_author) authored problems with the site in Portuguese, but the AI authoring tools answered in English (review item P3). Student AI help already passes the request locale (`clampLocale` in `getAIHelp`); the teacher-facing authoring prompts never got it.

## What Changes

- The narrative generator, the AI problem review, and the reference-solution generator receive the teacher's site locale, clamp it with `clampLocale`, and tell the model which language to write in.
- Narrative text, review feedback and edge-case rationales come back in the site language; edge-case inputs/outputs stay exact data, never translated.
- Reference-solution code comments (if any) are written in the site language; identifiers and output are unchanged.
- Tag suggestion is unchanged: it returns taxonomy keys only (the UI translates them), so it has no free text to localize.

## Capabilities

### New Capabilities
- `ai-authoring-locale`: teacher-facing AI authoring tools answer in the teacher's site language.

### Modified Capabilities
<!-- none: existing narrative/review/validation requirements still hold; this adds a cross-cutting language requirement -->

## Impact

- `web/lib/prompt.ts`: `getNarrativePrompt`, `getProblemReviewPrompt`, `getReferenceSolutionPrompt` take a `locale`.
- `web/lib/actions/problems/generate-problem-narrative.ts`, `review-problem.ts`, `generate-reference-solution.ts`: accept a locale argument.
- `web/hooks/use-generate-problem-narrative.tsx`, `use-review-problem.tsx`, `use-generate-reference-solution.tsx`: send `useLocale()`.
- No DB, judge, or API contract change.
