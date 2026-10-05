## Why

Every exercise in WhyRunner today is answered by typing source code into a text editor. That is a steep entry point for students who have never programmed: they hit syntax errors before they get to think about the logic. Audrito, Demo and Giovannetti (Olympiads in Informatics, vol. 6, 2012) recommend starting with friendly environments like Scratch and moving step by step to more algorithmic, text-based work. WhyRunner already supports Portugol, which is the middle step. The missing piece is a visual first step that still runs through the same judge.

## What Changes

- Lesson exercises get an **answer mode**: `code` (today's behavior, default), `blocks`, or `parsons`. The mode belongs to the exercise, not the problem, so the same problem can be a block exercise in an intro lesson and a code exercise in a later one.
- **Block mode**: the student builds the solution with Blockly blocks (variables, read/write, if/else, loops, arithmetic/logic). The web app turns the blocks into **Portugol** and submits that code to the judge as an ordinary Portugol submission. The student can open a read-only "view code" panel to see the generated Portugol.
- **Parsons mode**: the professor provides a correct solution. The student gets its lines shuffled, drags them into order (with indentation where the language needs it), and submits. The assembled program is graded by the judge on I/O, like any other submission, so any valid order passes.
- Submissions store the visual source (Blockly workspace JSON, or the Parsons line order) next to the generated `code`. The student's history and the professor's lesson review show the blocks or ordered lines, not only the generated code.
- AI hints know the answer mode and phrase hints in terms of blocks or line order, not code syntax. Lesson exercises get the AI-help button on failed submissions (until now only contests had it).
- Solution constraints (structural and algorithm-requirement) keep working unchanged, run against the generated code.
- **Judge: no change.** It keeps reading `code` + `language`.
- Out of scope for this change: flowchart mode (planned follow-up, likely an alternate rendering of the same structured program model), visual modes for contests and standalone problem pages, and Blockly-to-languages other than Portugol.

## Capabilities

### New Capabilities
- `block-programming-exercises`: authoring an exercise in block mode, the Blockly editor and Portugol code generation, submission storage of the workspace, read-only rendering in history/review, and block-aware AI hints.
- `parsons-exercises`: authoring a Parsons exercise from a solution, the shuffled drag-to-order editor, program assembly and I/O grading, and rendering of the submitted order.

### Modified Capabilities
- `dissertation-sync`: the thesis (`overleaf/main.tex`) must describe visual answer modes once they ship, and the Portuguese white paper must stay consistent.

## Impact

- **DB (web/drizzle)**: new `exercise_mode` enum and `exercise.mode` column (default `code`); `exercise.parsons_solution` for the Parsons source; `submission.editor_mode` + `submission.visual_source` (jsonb, nullable); `problem_validation.exercise_id` (nullable) so Parsons solution checks reuse validation runs without counting as the problem's own validation. Additive migration; existing rows default to `code`.
- **Web**:
  - Exercise authoring UI (mode picker, Parsons solution input).
  - `exercise-detail.tsx` picks the editor based on mode.
  - New Blockly editor component + Portugol generator.
  - New Parsons editor.
  - `createExerciseSubmission` accepts the visual source.
  - `getAIHelp` prompt gets the mode.
  - Lesson review and submission history render visual sources.
- **Dependencies**: `blockly` (npm). Parsons reordering uses native drag-and-drop plus arrow buttons, with no extra library. `@types/bun` (dev) for `bun test`.
- **Judge**: none. New `submission` columns must not break the judge's row decoding; to be verified.
- **i18n**: block labels and editor UI in pt-BR and en.
- **Thesis**: `overleaf/main.tex` and `overleaf/apps-edu.tex` get a short section on visual answer modes.
