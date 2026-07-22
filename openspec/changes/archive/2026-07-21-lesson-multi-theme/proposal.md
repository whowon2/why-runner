## Why

Lessons currently carry exactly one theme (`lesson.theme` scalar enum), but many exercises legitimately span several — a palindrome check exercises strings, arrays, and conditionals at once. Forcing a single theme misrepresents what the lesson teaches and undercounts skill progress in the other themes it touches.

## What Changes

- `lesson.theme` scalar column replaced by a many-to-many `lesson` ↔ `theme` relation (a lesson has one or more themes). **BREAKING** (schema change, not backward compatible with the single-theme column).
- Roadmap grouping (`getRoadmap()`) fans a lesson out into every theme section it belongs to, instead of one.
- `awardLessonCompletionIfFirstPass()` increments the theme skill counter for every theme tagged on the lesson, not just one, on first pass.
- Seed data (`seed-lessons.ts` `LESSON_MAP`) updated to assign an array of themes per lesson.
- Roadmap UI (`list.tsx`) unaffected in structure (still one card per theme), but a given lesson can now render inside multiple cards.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `learning-roadmap`: "Lessons are grouped by theme" requirement changes from exactly-one-theme to one-or-more-themes; roadmap grouping/display must show a lesson under each of its themes.
- `user-skills`: "First-time lesson pass increments theme skill" requirement changes from incrementing a single theme to incrementing every theme tagged on the lesson.

## Impact

- `web/drizzle/schemas/lessons.ts`: replace `lesson.theme` column with a new join table (e.g. `lessonTheme(lessonId, theme)`, composite PK); `userThemeSkill` table shape is unaffected.
- New Drizzle migration: create join table, backfill from existing scalar column, drop the column.
- `web/lib/actions/lessons/get-roadmap.ts`: grouping logic must join through the new table and allow a lesson to appear under multiple theme keys.
- `web/lib/actions/lessons/award-lesson-completion.ts`: theme-skill upsert must loop over the lesson's themes instead of a single upsert.
- `web/drizzle/seed-lessons.ts`: `LESSON_MAP` values become arrays of themes.
- `web/app/[locale]/roadmap/_components/list.tsx`: no structural change expected, verify duplicate-lesson rendering across cards.
