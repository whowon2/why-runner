## 1. Data model

- [x] 1.1 Add `allowedLanguages` (`language[]`, not null, default `{}`) to `exercise` and `problemOnContest` Drizzle schemas
- [x] 1.2 Generate migration `0055_allowed_languages.sql` (+ journal/snapshot) and apply it to the local DB
- [x] 1.3 Add pure helper `lib/allowed-languages.ts` (`isLanguageAllowed`, `offeredLanguages`, `allowedLanguagesSchema`) with a unit test

## 2. Server actions

- [x] 2.1 Enforce in `createExerciseSubmission` (code mode) with `LANGUAGE_NOT_ALLOWED`
- [x] 2.2 Enforce in contest `createSubmission`
- [x] 2.3 Enforce in `createRun` (exercise code mode and contest contexts)
- [x] 2.4 Add `setExerciseAllowedLanguages` (manage-lesson permission, zod input)
- [x] 2.5 Add `setContestProblemLanguages` (manage-contest permission, `CONTEST_STARTED` when locked)
- [x] 2.6 Add `LANGUAGE_NOT_ALLOWED` to `ActionErrors` in `messages/en.json` and `messages/br.json`

## 3. Teacher UI

- [x] 3.1 `AllowedLanguagesDialog` component (checkbox per language, save) + read-only badges
- [x] 3.2 Hooks for both setters with correct query invalidation
- [x] 3.3 "Languages" dialog on each lesson roadmap exercise row; badges show the allowed list
- [x] 3.4 Languages dialog on each contest Settings → Problems row (disabled once locked)

## 4. Student editor

- [x] 4.1 `WorkspaceSource.allowedLanguages`; set it in exercise and contest adapters
- [x] 4.2 `CodePane`: filter selector, preselect single language, replace disallowed restored language, refuse loading a disallowed past submission
- [x] 4.3 Statement line "Allowed languages: …" on exercise and contest problem

## 5. Verify and wrap up

- [x] 5.1 `bun lint`, typecheck, `bun test lib`
- [x] 5.2 Browser check on this worktree's DEV_PORT: teacher restricts an exercise and a contest problem; student sees filtered selector; direct disallowed submit is rejected
- [x] 5.3 Bump `web/package.json` minor version; add a row to `docs/evaluation/post-evaluation-changes.md`; document in `web/CLAUDE.md`
