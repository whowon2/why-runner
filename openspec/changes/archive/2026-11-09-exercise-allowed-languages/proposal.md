## Why

In the 2026-10-29 classroom test the professor asked to limit which programming languages students may use on a problem/list (professor survey review, item P2). Today `exercise.primaryLanguage` is only a "suggested language" label: the editor offers all six languages and the submit/run actions accept any of them, so a lesson meant to practise C can be answered in Python.

## What Changes

- New per-lesson-exercise setting `allowedLanguages` (`exercise.allowed_languages`, `language[]`, empty = every language), edited by whoever manages the lesson from a new "Languages" dialog on each exercise in the lesson roadmap.
- Same setting per contest problem (`problem_on_contest.allowed_languages`), edited from the contest Settings → Problems list; locked once the contest has started, like the problem list itself.
- Enforced server-side: `createExerciseSubmission` (code mode), `createSubmission` (contest) and `createRun` (exercise code mode and contest contexts) return `LANGUAGE_NOT_ALLOWED` for a language outside a non-empty list. Blocks and Parsons exercises are unaffected (their language is fixed by the mode).
- Editor: the workspace language selector lists only the allowed languages; a restored draft language or a loaded past submission in a disallowed language is not applied; a single allowed language is preselected.
- Student-facing label: the exercise statement shows "Allowed languages: …" instead of "Suggested language" when a list is set; contest problem statements show the same line. Roadmap badges show the list.
- Migration `0055_allowed_languages.sql` (no other open worktree adds a migration as of 2026-11-09).
- No judge change: the judge already runs whatever language the row carries.

## Capabilities

### New Capabilities
- `allowed-languages`: per lesson exercise and per contest problem list of languages students may use, its editing rules, server-side enforcement on submit and custom run, and the filtered editor language selector.

### Modified Capabilities
<!-- None: existing specs keep their requirements; the new capability adds the restriction on top. -->

## Impact

- DB: `web/drizzle/schemas/lessons.ts`, `web/drizzle/schemas/users.ts`, `web/drizzle/migrations/0055_allowed_languages.sql` (+ journal/snapshot).
- Server actions: `lib/actions/lessons/create-exercise-submission.ts`, `lib/actions/problems/create-submission.ts`, `lib/actions/runs/create-run.ts`, new `lib/actions/lessons/exercise-languages.ts`, new `lib/actions/contest/set-problem-languages.ts`; shared pure helper `lib/allowed-languages.ts`.
- UI: `components/workspace/code-pane.tsx`, `workspace-context.tsx`, `exercise-workspace.tsx`, `contest-problem-workspace.tsx`, `lesson-roadmap.tsx`, contest `settings/problems.tsx`, new picker component; hooks for the two setters; `messages/{en,br}.json`.
- Judge: none (`Language` enum unchanged).
