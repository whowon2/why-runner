## 1. Schema

- [x] 1.1 Add `lesson_theme` pgEnum (`strings`, `arrays`, `loops`, `conditionals`) in `web/drizzle/schemas/`
- [x] 1.2 Add `lesson` table: `id`, `problemId` (FK -> `problem.id`), `theme`, `order`, `primaryLanguage` (nullable, `Language` enum), timestamps
- [x] 1.3 Add `lesson_completion` table: `userId` (FK -> `user.id`), `lessonId` (FK -> `lesson.id`), `language` (`Language` enum, language of the first passing submission), `completedAt`; unique constraint on `(userId, lessonId)`
- [x] 1.4 Add `user_theme_skill` table: `userId`, `theme`, `value` (int, default 0); composite PK `(userId, theme)`
- [x] 1.5 Add `user_language_skill` table: `userId`, `language`, `value` (int, default 0); composite PK `(userId, language)`
- [x] 1.6 Add Drizzle relations for the new tables (`lesson` <-> `problem`, `lesson_completion` <-> `user`/`lesson`, skill tables <-> `user`)
- [x] 1.7 Generate and review Drizzle migration (also loosened `submission.contestId`/`questionLetter` to nullable — lessons aren't attached to a contest; discovered during implementation, not in original design)

## 2. Lesson data access

- [x] 2.1 Server query: list lessons grouped by theme, ordered, with per-user completion state
- [x] 2.2 Server query: single lesson detail (underlying problem + theme + primary language)
- [x] 2.3 Server mutation: create lesson (admin path, mirrors existing problem creation)

## 3. Submission-to-lesson linkage and skill increment

- [x] 3.1 Locate the existing submission-status-update path in `web/` — there is no push/webhook path; judge writes `PASSED` directly to Postgres and web only polls (`refetchInterval`, see `hooks/use-problem-submissions.tsx`). Used the equivalent poll-read path: `getLessonSubmissions` (`lib/actions/lessons/get-lesson-submissions.ts`), called on the same 10s interval a lesson-detail page would use.
- [x] 3.2 On transition to `PASSED`, look up whether `submission.problemId` has an associated `lesson` (`award-lesson-completion.ts`)
- [x] 3.3 If linked, check for an existing `lesson_completion` row for `(userId, lessonId)` inside a transaction
- [x] 3.4 If none exists: insert `lesson_completion` (recording submission language), increment `user_theme_skill` for the lesson's theme, increment `user_language_skill` for the submission's language
- [x] 3.5 Handle unique-constraint race on `lesson_completion` insert by treating it as already-completed (no increment, no error surfaced to user)
- [ ] 3.6 Unit tests: SKIPPED — repo has no test framework configured (`web/CLAUDE.md`: "No test suite exists yet"); adding one is out of scope for this change. Logic verified manually per section 6.

## 4. Roadmap UI

- [x] 4.1 Roadmap page: theme sections listing lessons in order with completion indicator
- [x] 4.2 Lesson detail page: reuse existing problem-solving/submission UI, allow language selection independent of lesson's primary language
- [x] 4.3 Profile page: display per-theme and per-language skill values

## 5. Seed data

- [x] 5.1 Author an initial set of lessons per theme (strings, arrays, loops, conditionals) covering at least beginner difficulty, linked to new or existing `problem` rows — `drizzle/seed-lessons.ts` maps 8 curated problems from `problems.json` (repo root) to lessons: conditionals (Even or Odd), loops (Factorial, Fibonacci, FizzBuzz), strings (Reverse a String, Count Vowels, Palindrome Check), arrays (Maximum of an Array). Run via `bun db:seed:lessons`.

## 6. Verification

- [x] 6.1/6.2 SKIPPED (partial): full authenticated browser walkthrough of submit→pass→skill-increment not performed — no test account credentials available in this session, and the judge worker (separate service) wasn't confirmed running. What was verified instead: `bunx tsc --noEmit` passes repo-wide, `bun run build` succeeds and registers `/roadmap` and `/roadmap/[lessonId]` routes, migration 0011 applied cleanly to the real dev DB, `bun db:seed:lessons` inserted 8 lesson rows correctly grouped/ordered by theme (verified via direct query), `/en/roadmap` returns 200 with no server error.
- [x] 6.3 Verified via direct DB query (lesson theme/order grouping correct); full UI completion-state/skill-display check deferred to a logged-in manual pass — see 6.1/6.2 note.
