## 1. Prompts

- [x] 1.1 Add `locale` to `getNarrativePrompt`, `getProblemReviewPrompt`, `getReferenceSolutionPrompt` in `web/lib/prompt.ts`, appending a language instruction via `clampLocale` / `LOCALE_LANGUAGE` (review: feedback + rationale localized, input/output verbatim; reference: comments only)

## 2. Actions and hooks

- [x] 2.1 Accept `locale` in `generateProblemNarrative`, `reviewProblem`, `generateReferenceSolution` and pass it to the prompt builders
- [x] 2.2 Send `useLocale()` from `use-generate-problem-narrative`, `use-review-problem`, `use-generate-reference-solution`

## 3. Verify and record

- [x] 3.1 Lint and typecheck `web/`
- [x] 3.2 Run the app on this worktree's `DEV_PORT`, log in as the local teacher in Portuguese, generate a narrative and run an AI review, and confirm Portuguese output
- [x] 3.3 Bump `web/package.json` patch version
- [x] 3.4 Add a row to `docs/evaluation/post-evaluation-changes.md`
