## 1. Schema

- [x] 1.1 Add `lessonThemeRequirement` table (`lessonId`, `theme`, `minValue`) to `web/drizzle/schemas/lessons.ts`, PK on `(lessonId, theme)`, `onDelete: "cascade"` from `lesson`
- [x] 1.2 Add `lessonLanguageRequirement` table (`lessonId`, `language`, `minValue`) to `web/drizzle/schemas/lessons.ts`, PK on `(lessonId, language)`, `onDelete: "cascade"` from `lesson`
- [x] 1.3 Add relations for both new tables (lesson -> many requirements, requirement -> one lesson), and add `themeRequirements`/`languageRequirements` to `lessonRelations`
- [x] 1.4 Generate Drizzle migration (`bun db:generate`) and review the SQL output

## 2. Lock computation

- [x] 2.1 In `web/lib/actions/lessons/get-roadmap.ts`, fetch each lesson's `themeRequirements`/`languageRequirements` alongside `themes`
- [x] 2.2 Fetch the current user's `userThemeSkill` and `userLanguageSkill` rows in the same `Promise.all` batch
- [x] 2.3 Add a `locked: boolean` (and the unmet/all requirement details needed for display) to each lesson in the roadmap response, computed by comparing requirement `minValue` against the user's skill value (missing skill row = 0)
- [x] 2.4 Add a `rewards` field to each lesson in the roadmap response derived from `themes` (theme rewards) — language reward is "current submission language," so express it generically (e.g. "+1 to whichever language you submit in") rather than a fixed language

## 3. Submission-time enforcement

- [x] 3.1 In `web/lib/actions/lessons/create-lesson-submission.ts`, before inserting the submission row, load the lesson (by `problemId`) with its `themeRequirements`/`languageRequirements`
- [x] 3.2 Load the current user's relevant `userThemeSkill`/`userLanguageSkill` rows and compute locked/unlocked using the same logic as task 2.3 (factor into a shared helper, e.g. `web/lib/actions/lessons/lesson-lock.ts`, used by both `get-roadmap.ts` and `create-lesson-submission.ts`)
- [x] 3.3 If locked, throw an error and do not insert the submission row or call `pg_notify`

## 4. Roadmap UI (quest presentation)

- [x] 4.1 Update the roadmap lesson card component to render requirements (theme/language + threshold) and rewards (+1 per tagged theme, +1 language) as quest-style info
- [x] 4.2 Render a locked visual state (e.g. dimmed/badge) for lessons the user hasn't unlocked, and disable/hide the submit action for locked lessons
- [x] 4.3 Add/update i18n strings in `web/messages/` (pt, en) for requirement, reward, and locked-state copy

## 5. Seed data

- [x] 5.1 Update `web/drizzle/seed-lessons.ts` to seed example requirements on at least one harder lesson (e.g. `strings` level 20, `arrays` level 15), matching the proposal's example

## 6. Verification

- [x] 6.1 `bun lint`
- [x] 6.2 Manually verify in dev: locked lesson shows requirements and blocks submission; meeting requirements unlocks it; rewards display matches actual skill increments on first pass
