## 1. Next-lesson data

- [x] 1.1 Add `getNextLesson(lessonId)` server action (e.g. in `web/lib/actions/lessons/get-lesson.ts` or a new sibling file) that finds the lesson with the next-higher `order` (tie-broken by `id`), returning `null` if none exists.
- [x] 1.2 Add a `useNextLesson(lessonId)` React Query hook wrapping the action, keyed distinctly from `["lessons", lessonId]`.

## 2. Page header + navigation chrome

- [x] 2.1 In `web/app/[locale]/roadmap/[lessonId]/page.tsx`, add a header region rendering lesson title, theme badges, and completion/lock badge (reuse `useLesson` data).
- [x] 2.2 Add a back-to-roadmap button/link in the header pointing at the roadmap route.
- [x] 2.3 Add a next-lesson control (button/link) using `useNextLesson`, hidden when there is no next lesson, navigating to `/roadmap/[nextLessonId]` when activated.
- [x] 2.4 Remove the now-redundant title/badge block from `LessonDetail`'s content card so it isn't duplicated.

## 3. Layout rebalance

- [x] 3.1 Update `LessonDetail`'s grid columns so the editor column is wider than the problem-statement column on large viewports (e.g. `lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]`).
- [x] 3.2 Increase the Monaco editor height beyond the fixed 300px (e.g. viewport-relative with a max, such as `min(600px, 60vh)`).
- [x] 3.3 Verify the submissions list below the editor remains visible/reachable at the new editor height on common viewport sizes.

## 4. Rewards & requirements on lesson page

- [x] 4.1 Extend `getLesson()` to return a full `requirements` list (theme/language, minValue, currentValue, met), alongside existing `unmetRequirements`.
- [x] 4.2 Render `lesson.rewards.themes` badges on the lesson page in any state (unlocked, completed), matching roadmap-list reward styling.
- [x] 4.3 Extend the locked-state card to list all requirements with threshold + current value (not just unmet ones), marking met vs. unmet per row.

## 5. i18n

- [x] 5.1 Add new strings under `RoadmapPage`/`RoadmapPage.Lesson` in `web/messages/en.json` and `web/messages/pt.json` for back button, next-lesson button, and any relocated header copy.

## 6. Verification

- [x] 6.1 Run `bun lint` in `web/`.
- [x] 6.2 Manually exercise: open a lesson, confirm header/back/next render correctly for a locked lesson, an unlocked lesson, a completed lesson, and the last lesson in order (no next control). Confirm rewards show in every non-locked state and full requirement list shows when locked.
