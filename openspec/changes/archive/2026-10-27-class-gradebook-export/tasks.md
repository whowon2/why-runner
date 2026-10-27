## 1. Aggregation core

- [x] 1.1 Add `web/lib/gradebook.ts` with `buildGradebook` (matrix, lesson subtotals, totals, maxTotal) reusing `computeExerciseScore`
- [x] 1.2 Add `gradebookToCsv` using `toCsv` from `lib/contest/export-bundle.ts`
- [x] 1.3 Unit tests in `web/lib/gradebook.test.ts` (ordering, null vs 0, totals, unpublished excluded upstream, CSV header/rows/formula escaping)

## 2. Server + hook

- [x] 2.1 Add owner-only `getClassGradebook` server action (zod id, `assertClassOwner`, public user columns, no raw output returned)
- [x] 2.2 Add `useClassGradebook` hook with key `["classes", classroomId, "gradebook"]`
- [x] 2.3 Invalidate the gradebook key from mutations that change its inputs

## 3. UI

- [x] 3.1 Add `/classes/[classSlug]/gradebook` page per `creating-a-page`
- [x] 3.2 Add `ClassGradebook` component (table, open-lesson marker, empty states, CSV download)
- [x] 3.3 Add owner-only "Gradebook" button to class page header
- [x] 3.4 Add pt/en messages

## 4. Verify

- [x] 4.1 `bun test lib`, `bun lint`, `bunx tsc --noEmit` pass
- [ ] 4.2 Manually load the page as owner and as a student
