## Why

A teacher reported (2026-11-12) that they registered 3 test cases per exercise but students saw only 2. `ProblemExamples` (`web/app/[locale]/problems/_components/examples.tsx`) hardcodes `inputs.slice(0, 2)`, a leftover from the old `exampleCount` days, so any visible test past the second is silently dropped from both the problem statement and the lesson exercise workspace. New tests also start hidden in the editor, and the only sign of that is a small checkbox, which makes it easy for a teacher to miss that a test is hidden.

## What Changes

- `ProblemExamples` renders every test its caller passes. Callers already pass only tests the viewer may see (`getProblem` and `getExercise` filter through `visibleTests` on the server), so no hidden data reaches it.
- The problem editor shows each test's state at a glance: a "Visible to students" / "Hidden" badge next to the test's label, plus a summary of how many tests are visible ("2 of 3 tests visible to students").
- New tests still start hidden (default unchanged).
- `web/package.json` patch bump.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `test-case-visibility`: the statement examples must list every visible test (no cap); the editor must show each test's visible/hidden state and a visible count.

## Impact

- `web/app/[locale]/problems/_components/examples.tsx` (problem statement + exercise workspace examples)
- `web/app/[locale]/problems/_components/create.tsx` (problem editor test list)
- `web/messages/en.json`, `web/messages/br.json`
- No DB, server-action or judge changes.
