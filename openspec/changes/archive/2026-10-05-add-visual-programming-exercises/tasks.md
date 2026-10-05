## 1. Data model

- [x] 1.1 Add `exercise_mode` pgEnum (`code`, `blocks`, `parsons`) and `exercise.mode` (not null, default `code`) and `exercise.parsons_solution` (text, nullable) in `web/drizzle/schemas/lessons.ts`
- [x] 1.2 Add `submission.editor_mode` (`exercise_mode`, nullable) and `submission.visual_source` (jsonb, nullable) in `web/drizzle/schemas/submissions.ts`
- [x] 1.3 Add `problem_validation.exercise_id` (uuid, nullable) in `web/drizzle/schemas/validations.ts`
- [x] 1.4 Generate the Drizzle migration and check it is purely additive (no backfill, no NOT NULL without default)
- [x] 1.5 Make the problem publish/staleness queries ignore `problem_validation` rows with `exercise_id` set; add a test showing a Parsons check run does not count as the problem's validation
- [x] 1.6 Confirm the judge is unaffected: run `cargo test grade_tests` (sandboxed invocation from `judge/CLAUDE.md`) against a DB with the new columns, and check the judge's validation claim query also uses an explicit column list

## 2. Exercise authoring

- [x] 2.1 Server action to set an exercise's mode (owner-only); `blocks` forces `primaryLanguage = portugol`, `parsons` requires `primaryLanguage`
- [x] 2.2 Server action to save a Parsons solution: insert a `problem_validation` run with `exercise_id`, `pg_notify('new_validation', ...)`, and store `parsons_solution` only once the run is `PASSED`; surface the failing test case otherwise
- [x] 2.3 Mode picker + Parsons solution editor in the lesson management UI (`manage-lesson.tsx` / exercise settings), with pt-BR and en strings
- [x] 2.4 Invalidate the affected React Query caches in the new mutation hooks (follow the `mutation-cache-invalidation` skill)

## 3. Portugol block generator (pure TS, no UI)

- [x] 3.1 Add the `blockly` dependency (no `serverExternalPackages` needed: the server never imports Blockly, see 3.5)
- [x] 3.2 Define the v1 custom blocks: typed declare-variable (`inteiro`/`real`/`cadeia`/`logico`), get and set; `leia`, `escreva`; `se`/`senao`; `enquanto`, `para`, `faca … enquanto`; arithmetic, comparison and logic operators; number/text/boolean literals
- [x] 3.3 Implement `portugolGenerator`, which outputs `programa { funcao inicio() { ... } }` with declarations first
- [x] 3.4 Golden unit tests: one per block, plus whole programs (sum of two numbers, loop with counter, nested if, multi-value input line)
- [x] 3.5 Server-side generation: implemented as a pure walker over Blockly's serialized JSON (no headless Blockly/jsdom), shared by client and server; recorded in design.md decision 4
- [x] 3.6 End-to-end check: run generated programs for 2–3 sample problems through the judge's Portugol runner and confirm `PASSED`

## 4. Block editor UI

- [x] 4.1 `BlockEditor` client component (dynamic import, only loaded when `mode = blocks`) with the v1 toolbox and localized block labels (pt-BR, en)
- [x] 4.2 Read-only "view code" panel showing live generated Portugol
- [x] 4.3 `exercise-detail.tsx`: pick the editor by `exercise.mode`; hide the language selector for `blocks`
- [x] 4.4 Read-only `BlockViewer` component for rendering a stored workspace

## 5. Parsons editor UI

- [x] 5.1 Server-side line builder: split `parsons_solution` into non-blank lines, strip leading indentation, shuffle per load; client submits ordered line texts (see design.md decision 4)
- [x] 5.2 `ParsonsEditor` client component: drag to reorder, per-line indent controls, keyboard-accessible
- [x] 5.3 Wire into `exercise-detail.tsx` for `mode = parsons`
- [x] 5.4 Read-only `ParsonsViewer` rendering a submitted order with indentation

## 6. Submission flow

- [x] 6.1 Extend `createExerciseSubmission` to take `visualSource` for non-code modes and to ignore client `code` in those modes
- [x] 6.2 `blocks`: reject empty workspace; generate Portugol on the server; store `editor_mode`, `visual_source`, `code`, `language = portugol`
- [x] 6.3 `parsons`: validate the item list (no unknown, missing, or repeated ids); assemble the program with the submitted indentation (4 spaces per level); store `editor_mode`, `visual_source`, `code`, `language = primaryLanguage`
- [x] 6.4 Tests for 6.2/6.3 at module level (`bun test lib`): empty/incomplete workspace → generator errors, tampered Parsons lines rejected, alternative valid order assembled; client-code-ignored verified via the UI run (server regenerates code)

## 7. History, review and AI hints

- [x] 7.1 Student submission history on the exercise page renders `BlockViewer` / `ParsonsViewer` when `visual_source` is present, with a toggle to the generated code
- [x] 7.2 Professor lesson review (`lesson-review.tsx` / `getLessonReview`) does the same
- [x] 7.3 Pass `editor_mode` into `getAIHelp` → `getUserPrompt`; add block-mode and Parsons-mode prompt instructions (refer to block labels in the user's locale; Parsons hints only about order/nesting)
- [x] 7.4 Check constraint violations display correctly for `blocks` submissions (structural check runs on the generated Portugol)

## 8. Documentation

- [x] 8.1 Update `web/CLAUDE.md` with the answer-mode model, where the generator lives, and the server-side regeneration rule
- [x] 8.2 Thesis: add a visual answer modes paragraph to the Class, Lesson, and Exercise Model section of `overleaf/main.tex` (motivation: gradual progression from visual to text programming, citing Audrito et al. 2012) and mirror it in `overleaf/apps-edu.tex`

## 9. Verification

- [x] 9.1 `bun run lint` / typecheck / tests pass in `web/`
- [x] 9.2 Manual run-through as professor and student: create a `blocks` exercise and a `parsons` exercise, submit pass/fail answers, request AI hints, view the professor review
