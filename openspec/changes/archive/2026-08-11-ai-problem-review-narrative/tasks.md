## 1. Schema

- [x] 1.1 Add nullable `narrative: text` column to `problem` in `web/drizzle/schemas/problems.ts`
- [x] 1.2 Run `bun db:generate` to create the migration, review the generated SQL
- [x] 1.3 Apply migration locally (`bun db:migrate` or `bun db:push` in dev) and confirm `Problem`/`Partial<Problem>` types pick up `narrative`

## 2. Prompts

- [x] 2.1 Add `SYSTEM_INSTRUCTION_PROBLEM_REVIEW` and `getProblemReviewPrompt({problem})` to `web/lib/prompt.ts`, following the existing XML-tag untrusted-content convention (`getReferenceSolutionPrompt` as template); instruct the model to return the review as JSON matching `{descriptionFeedback, edgeCases}`
- [x] 2.2 Add `SYSTEM_INSTRUCTION_NARRATIVE` and `getNarrativePrompt({problem})` to `web/lib/prompt.ts`, same untrusted-content convention, instructing an AoC-style themed story framing the problem

## 3. Server actions

- [x] 3.1 Create `web/lib/actions/problems/review-problem.ts` — `reviewProblem(problemId)`: auth + ownership check (mirror `generate-reference-solution.ts`), load problem, call Gemini with `responseMimeType: "application/json"` + `responseSchema` for `{descriptionFeedback: string, edgeCases: {input, output, rationale}[]}`, parse with try/catch, return parsed object; no DB write
- [x] 3.2 Create `web/lib/actions/problems/generate-problem-narrative.ts` — `generateProblemNarrative(problemId)`: same auth pattern, call Gemini with `SYSTEM_INSTRUCTION_NARRATIVE`/`getNarrativePrompt`, strip any defensive code-fence/markdown wrapper if needed, return narrative string; no DB write
- [x] 3.3 Extend `web/lib/actions/problems/update-problem.ts` to accept `narrative` in the allowed `Partial<Problem>` field set (mirror how `description` is handled), still scoped to `createdBy = currentUser.id` — already generic (`Partial<Problem>` passthrough), no code change needed now that `Problem` includes `narrative`
- [x] 3.4 Confirm `getMissingProblemFields` in `publish-problem-shared.ts` is untouched (narrative stays optional, not a publish requirement)

## 4. Hooks

- [x] 4.1 Create `web/hooks/use-review-problem.tsx` — plain `useMutation` wrapping `reviewProblem`, no cache invalidation (ephemeral result)
- [x] 4.2 Create `web/hooks/use-generate-problem-narrative.tsx` — plain `useMutation` wrapping `generateProblemNarrative`, no cache invalidation
- [x] 4.3 Confirm existing `useUpdateProblem()` requires no changes to persist `narrative` (it already forwards `Partial<Problem>`)

## 5. Workspace UI — AI review panel

- [x] 5.1 Create `problem-review-panel.tsx` alongside `web/app/[locale]/problems/_components/workspace/validation.tsx`, following its Brain-icon "Review with AI" button convention
- [x] 5.2 Render `descriptionFeedback` via the existing `ReactMarkdown` setup (pattern from `ai-dialog.tsx`)
- [x] 5.3 Render each suggested edge case as a card (input/output/rationale) with an "Add test case" button that pushes `{input, output}` into the form's `inputs`/`outputs` `useFieldArray`
- [x] 5.4 Wire loading/error states through `sonner` `toast.error`, matching `validation.tsx`'s error handling
- [x] 5.5 Mount the new panel in `web/app/[locale]/problems/_components/create.tsx` (or its workspace wrapper) near the existing validation panel

## 6. Workspace UI — narrative field

- [x] 6.1 Add a `narrative` field to the edit form's Zod schema and React Hook Form state in `create.tsx`
- [x] 6.2 Add a narrative `Textarea`/markdown editor section (new tab or section) with a "Generate with AI" button (Brain icon) wired to `useGenerateProblemNarrative()`, populating the field on success for the author to edit
- [x] 6.3 Confirm saving the form (existing save path via `useUpdateProblem`) persists the narrative field

## 7. Student-facing display

- [x] 7.1 Locate the Task tab's description render point (standalone problem page workspace, `problem-workspace` capability) and render `narrative` above the description when set, styled distinctly as flavor text (e.g. italic/callout block) via the same markdown renderer used for description
- [x] 7.2 Confirm no narrative section renders when `narrative` is null/unset

## 8. i18n

- [x] 8.1 Add new message keys to `web/messages/en.json` and `web/messages/br.json` for: review panel button/labels/empty state, edge-case card labels, narrative field label and "Generate with AI" button — follow the naming pattern used for `generateWithAi` in the reference-solution feature

## 9. Docs

- [x] 9.1 Append a short "AI Problem Review" / "Problem Narrative" section to `web/CLAUDE.md`, following the existing "AI Help" section's format

## 10. Verification

- [x] 10.1 `bun lint` in `web/` with no new errors — pre-existing failures unrelated to this change confirmed on `main`; all new/changed files lint clean
- [ ] 10.2 Manual pass per the approved plan: trigger review, accept a suggested edge case, generate + edit + save a narrative, reload and confirm persistence, view as student and confirm narrative renders above description, confirm publish succeeds with narrative empty
