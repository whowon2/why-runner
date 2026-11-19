## 1. Examples

- [x] 1.1 Remove `slice(0, 2)` from `ProblemExamples`; document that callers pass only visible tests
- [x] 1.2 Confirm `ProblemDescription` (`getProblem`) and `ExerciseWorkspace` (`getExercise`) pass only server-filtered visible tests

## 2. Editor visibility state

- [x] 2.1 Add per-test "Visible to students" / "Hidden" badge next to the input label in `create.tsx`
- [x] 2.2 Add "N of M tests visible to students" summary above "Add input/output"
- [x] 2.3 Add strings to `messages/en.json` and `messages/br.json`

## 3. Release

- [x] 3.1 Bump `web/package.json` patch version
- [x] 3.2 `bun lint`, `bunx tsc --noEmit`, verify in browser
- [x] 3.3 Open PR
