## Context

Lesson exercises (`exercise` table, `web/drizzle/schemas/lessons.ts`) are answered today through a Monaco text editor in `web/app/[locale]/classes/_components/exercise-detail.tsx`. The student picks a language (or the exercise's `primaryLanguage`) and `createExerciseSubmission` inserts a `submission` row with `code` + `language`, then `pg_notify('new_submission', id)`.

The judge claims rows with an explicit column list (`RETURNING id, code, language, problem_id, user_id, contest_id, question_letter, retry_count, exercise_id` in `judge/src/db.rs`). New `submission` columns are therefore invisible to it, and adding them is safe without any judge change.

Portugol is already a judge language (`portugol-console-2.7.5.jar`) with its own loop-keyword support in the structural-constraint checker (`judge/src/constraints.rs`: `para`, `enquanto`, `repita`).

Stakeholders: professors authoring lessons for beginners, students in their first programming course, the thesis (visual modes become part of the described system).

## Goals / Non-Goals

**Goals:**
- Two new answer modes for lesson exercises, `blocks` and `parsons`, next to today's `code`.
- Both modes produce ordinary source code that the existing judge grades by I/O, with no judge change.
- What the student built (blocks, line order) is stored and shown back to the student and the professor.
- Solution constraints and AI hints keep working in the new modes.

**Non-Goals:**
- Flowchart mode. It's a follow-up; see the "Structured-only blocks" decision for why this change keeps that door open.
- Visual modes in contests or on the standalone problem page.
- Blockly → any language other than Portugol.
- Parsons distractor lines (wrong lines mixed in). Possible follow-up.
- Functions/procedures, arrays and other advanced constructs in the block toolbox (v1 covers the basics of an intro course).

## Decisions

### 1. Mode lives on `exercise`, not on `problem`
Add `exercise_mode` enum (`code` | `blocks` | `parsons`) and `exercise.mode` (default `code`).
- *Why:* the same problem is reused across lessons (`lesson-track-authoring`: "The same problem can back lesson entries in more than one track"). Whether students answer with blocks is a teaching choice for one lesson, not a property of the problem.
- *Alternative:* `problem.mode`. Rejected: it would force every lesson, contest and the standalone page to use the same mode.
- `blocks` forces `primaryLanguage = portugol`. `parsons` requires `primaryLanguage` to be set, any language.

### 2. Blockly with a custom Portugol generator
Use Google's `blockly` npm package, a custom toolbox and a hand-written `portugolGenerator` (a `Blockly.CodeGenerator`).
- *Why Blockly:* mature, accessible, works with React, has the generator API built in. Scratch-GUI is far heavier and built around sprites/animation, not I/O programs.
- *Why Portugol:* Brazilian intro courses already teach algorithms in Portuguese pseudo-code. The keywords match the blocks' Portuguese labels, and the "view code" panel is the bridge from blocks to text.
- **Toolbox v1:**
  - Typed variable declaration (`inteiro`, `real`, `cadeia`, `logico`, with a type dropdown) and assignment.
  - `leia` / `escreva`.
  - `se` / `senao`.
  - `enquanto`, `para`, `faca … enquanto`.
  - Arithmetic, comparison and logical operators (`e`, `ou`, `nao`), plus number/text/boolean literals.
- **Typed variables:** Portugol needs a type on every declaration, but Blockly's built-in variables are untyped. Use a custom "declare variable" block with a type dropdown, and have `get`/`set` blocks reference declared names.
- **Output shape:**
  ```
  programa {
    funcao inicio() {
      <declarations>
      <statements>
    }
  }
  ```

### 3. Structured-only blocks
Every block maps to one structured construct (no jumps, no free-form wiring). Blocks can't express unstructured control flow, so the generated program is always valid structured Portugol, and the same workspace can later be drawn as a structured flowchart. That makes the flowchart mode a renderer, not a new editor model.

### 4. Server regenerates code from the visual source
The client sends the visual source. The server derives `code` from it; it does not trust client-sent code in `blocks` or `parsons` mode.
- **Parsons:** the client sends the ordered lines (`[{ text, indent }]`). The server checks they are exactly the solution's lines (same multiset; identical lines are interchangeable, and indents must be in range) and assembles the program. Sending line text instead of opaque ids needs no server-side secret, and reveals nothing new: the student already sees every line.
- **Blocks:** `lib/blocks/portugol-generator.ts` walks Blockly's serialized workspace JSON directly and does not import Blockly. The same function runs in the browser (live "view code" panel) and in the submit action, so no headless Blockly or jsdom is needed on the server.
- *Why:* otherwise a student could submit hand-typed code with an empty workspace and get credit on a block exercise, and the professor's review would show blocks that don't match what was graded.
- *Alternatives considered:* trusting the client's generated code (rejected for the reason above), and headless Blockly on the server (the original plan; dropped during implementation because it pulls jsdom into the server bundle, while a JSON walker is smaller and testable with `bun test`).
- The client must send a plain JSON copy of the workspace (`JSON.parse(JSON.stringify(...))`). Blockly's own serialized object isn't plain, and React server actions pass it as an opaque reference that arrives server-side as `undefined`.

### 5. Submission storage
Add `submission.editor_mode` (`exercise_mode`, nullable, null means `code`) and `submission.visual_source` (`jsonb`, nullable). `code` always holds the program the judge ran. Lesson review and submission history render `visual_source` read-only when present (Blockly workspace in read-only mode, Parsons as ordered/indented lines), with a toggle to see the generated code.

### 6. Parsons authoring and shuffling
- The professor pastes a correct solution into `exercise.parsons_solution` (text). Each non-blank line becomes an item with its leading indentation stripped.
- Items get random opaque ids and are shuffled **server-side** per page load. Neither ids nor client order reveal the original order.
- The student sets each line's indent level. Indentation matters for Python and is cosmetic for brace languages.
- Grading is by the judge on I/O, not by comparing with the original order, so any order that works passes.
- Identical lines (e.g. two `}`) are interchangeable.

### 7. Constraints and AI hints
- **Constraints:** run unchanged on `code` (the generated program). No judge or checker change.
- **AI hints:** lesson exercises had no AI-help entry point before this change (only contests did), so the exercise submission list now shows the existing `AIDialog` on failed/errored submissions. `getAIHelp` passes `editor_mode` into `getUserPrompt`. In `blocks` mode the prompt tells Gemini to refer to blocks by their on-screen (localized) labels, not code syntax. In `parsons` mode it says the student only reorders/indents given lines, so hints must be about order and nesting, never about writing new code.

### 8. Validation of reference solutions
Pre-publish validation (`problem-io-validation`) belongs to the problem and stays code-based. A Parsons exercise's `parsons_solution` is checked once when the professor saves it: it's submitted as a validation-style run against the problem's test cases, and saving is blocked unless it passes, so students can never get a Parsons exercise that has no correct order.
- **How it runs:** the check reuses the existing `problem_validation` table and its `new_validation` judge path (no judge change). The table gets a nullable `exercise_id` column.
- **Keeping it separate:** a run with `exercise_id` set belongs to that exercise's Parsons check. The problem's publish/staleness logic MUST ignore those rows (filter `exercise_id IS NULL`), so a Parsons check never counts as the problem's own pre-publish validation. Block exercises need no extra check; the problem's own validation already covers solvability.

## Risks / Trade-offs

- **[Portugol generator bugs produce wrong code]** → Unit-test the generator per block (golden Portugol output). Add an end-to-end test that runs generated programs through the judge's Portugol runner for a few sample problems.
- **[Portugol stdin quirks]** The judge normalizes spaces/newlines for Portugol input. → Golden tests with multi-value input lines.
- **[Parsons gives away the solution's lines]** Inherent to the format. Acceptable for beginner exercises; the professor picks Parsons knowingly. Distractors (future) reduce it.
- **[Bundle size on the exercise page]** Blockly is large. → `next/dynamic` import, loaded only when `mode = blocks`.
- **[Translated block labels vs AI hints]** Hints must use the same label text the student sees. → Pass the active locale's block-label map to the prompt, or keep labels stable through the i18n keys used by both.

## Migration Plan

1. Additive Drizzle migration:
   - `exercise_mode` enum.
   - `exercise.mode` (default `'code'`, not null).
   - `exercise.parsons_solution` (text, nullable).
   - `submission.editor_mode` (nullable).
   - `submission.visual_source` (jsonb, nullable).
   - `problem_validation.exercise_id` (uuid, nullable).

   No backfill is needed; every existing row stays `code`. Per repo convention, migrations run at build time.
2. Ship the web changes. The judge is untouched; its explicit `RETURNING` list ignores the new columns.
3. **Rollback:** revert the web deploy. The extra columns are inert to the old code. Drop them in a follow-up migration only if the feature is abandoned.

## Open Questions

- ~~Multi-argument `escreva` vs a separate "new line" block?~~ Resolved: one single-value `escrever` block with a "pular linha" (new line) checkbox, checked by default.
- Do professors want to start a block exercise with pre-placed blocks (a starter workspace)? It's cheap to add as `exercise.starter_visual_source`, but it's not in v1.
- Whether to show the "view code" panel always, or let the professor hide it for the first lessons.
