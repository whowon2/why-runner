## Context

`lesson.theme` is currently a single `pgEnum` column (`web/drizzle/schemas/lessons.ts`, `LessonTheme` = `strings|arrays|loops|conditionals`). Three places depend on its single-value cardinality: roadmap grouping (`get-roadmap.ts`), skill-award logic (`award-lesson-completion.ts`), and seed data (`seed-lessons.ts`). `userThemeSkill` is already a per-(user, theme) join table and needs no shape change — it just needs to be upserted multiple times per lesson pass instead of once.

## Goals / Non-Goals

**Goals:**
- Let a lesson be tagged with one or more themes.
- Roadmap displays the lesson under every theme it's tagged with.
- First-time pass awards skill credit for every theme on the lesson.

**Non-Goals:**
- Changing the fixed theme vocabulary (`strings`, `arrays`, `loops`, `conditionals`).
- Changing `userThemeSkill` or `userLanguageSkill` table shape.
- Weighting skill increments by theme count (each tagged theme gets a full +1, same as today's single-theme case).

## Decisions

**Join table over array column.** Replace `lesson.theme: LessonTheme().notNull()` with a new `lessonTheme` table: `(lessonId FK, theme LessonTheme, PRIMARY KEY(lessonId, theme))`. Considered a Postgres array/enum[] column instead, but the join-table pattern is already used for `userThemeSkill`/`userLanguageSkill` in this schema, keeps referential integrity via FK, and makes `getRoadmap()`'s existing group-by-theme query a straightforward join rather than an `unnest()`.

**Migration: additive-then-cutover.** Add `lessonTheme`, backfill one row per existing `lesson.theme` value, switch reads/writes to the join table, then drop `lesson.theme` in the same migration set (single deploy, no read window where both must be kept in sync — dataset is small, admin-managed lesson content).

**Award logic loops per theme, not per lesson.** `awardLessonCompletionIfFirstPass()` still gates on lesson-level first pass (one `lessonCompletion` row), then iterates the lesson's themes and does one `userThemeSkill` upsert per theme. No change to the first-pass gating semantics — only to how many skill rows get touched once that gate passes.

## Risks / Trade-offs

- [Existing single-theme assumption in any untracked code path] → grep for `.theme` usages on the `lesson` table beyond the four files identified before removing the column; verify no compile errors after the Drizzle type changes.
- [Roadmap card duplicates same lesson N times, confusing "completed" state repeated per card] → intentional per requirement; each card is scoped to its own theme so this matches the "grouped by theme" mental model, not a bug.
- [Backfill data loss if migration order is wrong] → backfill step must run before the `DROP COLUMN lesson.theme` step in the same migration; verify row counts match (`count(lessonTheme) >= count(lesson)`) before drop.

## Migration Plan

1. Add `lessonTheme` table + FK to `lesson`.
2. Backfill: `INSERT INTO lesson_theme (lesson_id, theme) SELECT id, theme FROM lesson`.
3. Update `seed-lessons.ts`, `get-roadmap.ts`, `award-lesson-completion.ts` to read/write `lessonTheme`.
4. Drop `lesson.theme` column.
5. No rollback path beyond restoring from pre-migration backup — column drop is destructive; take a DB snapshot before applying in any shared environment.

## Open Questions

- None — theme vocabulary and skill-increment semantics carry over unchanged, only cardinality changes.
