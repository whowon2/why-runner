## 1. Schema

- [x] 1.1 Add `lessonTheme` table to `web/drizzle/schemas/lessons.ts` (`lessonId` FK to `lesson.id`, `theme` `LessonTheme`, composite PK `(lessonId, theme)`) — table named `lesson_themes` in SQL (plural) to avoid a name collision with the `lesson_theme` enum type
- [x] 1.2 Generate Drizzle migration: create `lessonTheme` table
- [x] 1.3 Write backfill migration step: `INSERT INTO lesson_themes (lesson_id, theme) SELECT id, theme FROM lesson`
- [x] 1.4 Write migration step to drop `lesson.theme` column, and remove the column from the Drizzle schema
- [x] 1.5 Verify backfill row count (`count(lesson_themes) >= count(lesson)`) before the drop step runs — enforced via a `DO $$` guard in the migration; applied cleanly against local dev DB

## 2. Server actions

- [x] 2.1 Update `web/lib/actions/lessons/get-roadmap.ts` to join `lesson` with `lessonTheme` and group lessons by each associated theme (a lesson may appear in multiple groups)
- [x] 2.2 Update `web/lib/actions/lessons/award-lesson-completion.ts`: after the first-pass gate, loop over the lesson's themes and upsert `userThemeSkill` (+1) for each
- [x] 2.3 Update `web/drizzle/seed-lessons.ts` `LESSON_MAP` to assign an array of themes per lesson (e.g. palindrome-check → `["strings", "arrays", "conditionals"]`)

## 3. UI

- [x] 3.1 Verify `web/app/[locale]/roadmap/_components/list.tsx` renders correctly when the same lesson appears under multiple theme cards (no duplicate-key warnings, independent completion state per card) — keys are scoped per-`Card` (`l.id`) and per-list (`track.theme`), so no collisions; no code change needed

## 4. Verification

- [ ] 4.1 Re-seed lessons locally and confirm a multi-theme lesson (e.g. palindrome check) appears under all its tagged theme sections on the roadmap — NOT DONE: requires wiping/reseeding local lesson data or a browser session; direct DB writes were blocked by the auto-mode classifier (destructive-action guard) and no browser tool is available in this session. Needs manual verification.
- [ ] 4.2 Pass a multi-theme lesson as a test user and confirm all tagged theme skill counters increment by 1, and language skill increments as before — NOT DONE, same reason as 4.1
- [ ] 4.3 Resubmit the same lesson and confirm no further theme/language skill increments occur — NOT DONE, same reason as 4.1
- [x] 4.4 Run `web` typecheck/lint after removing `lesson.theme` to catch any remaining single-theme usages — `tsc --noEmit` clean, `bun lint` clean on touched files (pre-existing unrelated lint errors elsewhere untouched)
