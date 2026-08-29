## Why

The dissertation (`overleaf/main.tex`, `overleaf/apps-edu.tex`) still describes WhyRunner purely as a contest judge with AI hint feedback — the state of the codebase around PR #46 (prepublish I/O validation). Since then the product pivoted (see `openspec/specs/learning-roadmap`, `lesson-track-authoring`, `lesson-grading`, `solution-constraints`, `ai-problem-review`, `notifications`) into a professor/student authoring platform: professors build Classes with ordered Lesson assignments made of Exercises, get AI-assisted problem drafting and narrative flavor text, enforce solution constraints, and students get per-exercise grading and in-app notifications. None of this is registered in the dissertation, so the written thesis no longer matches the system being defended.

## What Changes

- Document the Classes → Lessons → Exercises → Assignments authoring/learning model (professor-curated roadmap, replacing the earlier "AI-guided path" framing) in System Design.
- Document AI-assisted authoring capabilities beyond hint feedback: AI-drafted reference solutions (title/topic → description, example I/O, reference solution), AI problem review, and AI-generated narrative flavor text.
- Document pre-publish I/O validation (reference solution run through the judge sandbox before a problem can be published; edits to I/O invalidate a prior pass) and solution-constraint enforcement (forbidden constructs / required-algorithm checks on student submissions).
- Document per-exercise grading derived from judge test results (assignment score now composed from individual exercise pass/fail rather than a single aggregate).
- Document the in-app notifications system and assignment resubmit/review flow (confirmation prompt before submitting an assignment with unsolved exercises).
- Update Related Work / Comparative Analysis framing if the professor-authoring angle changes WhyRunner's differentiation story versus Ataux, GOJ, Run Codes, BOCA.
- Update Limitations / Future Work: remove items now shipped (roadmap-as-professor-curated-track, solution-constraint enforcement were listed as future/backlog and are now implemented); keep language-support gaps and quantitative-evaluation gap as still open.
- Update `apps-edu.tex` (Diferenciais, Aspectos Tecnológicos, Arquitetura) to match the same additions, in Portuguese.
- No application code changes — this is a documentation-only change to the `overleaf/` LaTeX sources.

## Capabilities

### New Capabilities
- `dissertation-sync`: requirements for what shipped product capabilities the dissertation text must accurately reflect, so future feature work has a checklist for keeping `overleaf/` in sync.

### Modified Capabilities
(none — no application-level requirement changes; this change only edits `overleaf/` documentation)

## Impact

- Affected files: `overleaf/main.tex`, `overleaf/apps-edu.tex` (and figures if new diagrams are needed for the Classes/Lessons/Exercises flow).
- No code, schema, or API changes.
- Source of truth for the new content: `openspec/specs/learning-roadmap`, `lesson-track-authoring`, `lesson-grading`, `lesson-requirements`, `solution-constraints`, `problem-io-validation`, `ai-problem-review`, `problem-narrative`, `notifications`, `notification-preferences`, plus the shipped commit history from `ceaac3e` (lesson/exercise rename) through `6fa7f34` (per-exercise grading).
