## Context

`ProblemExamples` is shared by `ProblemDescription` (standalone and contest problem statements, fed by `getProblem`) and the lesson `ExerciseWorkspace` statement (fed by `getExercise().tests`). Both server actions already reduce tests to the viewer's visible set with `visibleTests` (`lib/judge-report.ts`), so the client-side `slice(0, 2)` is not a security boundary; it is a stale UI cap from the `exampleCount` era (removed in migration 0050).

## Goals / Non-Goals

**Goals:** show every visible test; make visible/hidden state obvious in the editor.

**Non-Goals:** changing the default of new tests (stays hidden; product decision left to the owner); changing visibility rules or server filtering.

## Decisions

- **Remove the cap entirely** rather than raise it. The author already chooses which tests are examples; a second, invisible limit contradicts that choice. Long lists are fine in the scrolling statement pane.
- **Editor badge + count** instead of changing the checkbox. The checkbox stays the control; the badge (`Eye` / `EyeOff` icon, success vs muted tone) next to "Input N" is the at-a-glance state, and a summary line above "Add input/output" gives the total. The existing "no examples" hint stays.

## Risks / Trade-offs

- [A future caller passes unfiltered tests] → `ProblemExamples` documents that callers must pass only visible tests; both current callers are server-filtered.
