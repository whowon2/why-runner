## 1. Data layer

- [x] 1.1 `get-class.ts`: include membership `joinedAt` on each student
- [x] 1.2 Add `lib/actions/classes/get-class-student-submissions.ts` (manager-only, zod input, student-of-class check, class-scoped join, no output/code, excludes CANCELED, limit 10)
- [x] 1.3 Add `hooks/use-class-student-submissions.tsx` (key under `["classes", classroomId, ...]`), check against mutation-cache-invalidation skill
- [x] 1.4 Add pure `matchesMemberQuery` helper in `lib/` + Bun unit test (accents, case, `@`, RA)

## 2. Roster UI

- [x] 2.1 Add `member-row.tsx`: avatar/initials, name, `@username`, RA, role badge, dividers + hover, row click handler
- [x] 2.2 Add `member-actions-menu.tsx`: "⋯" DropdownMenu with Make co-teacher / Make student (owner-level) and Remove with controlled AlertDialog confirm; hidden when no actions
- [x] 2.3 Add `class-people.tsx`: Teachers card (count, add co-teacher), Students card (count, search, empty + no-match states), selected-student state
- [x] 2.4 Remove `member-role-button.tsx` and `remove-member-button.tsx` (after checking no other imports)

## 3. Student panel

- [x] 3.1 Add `student-sheet.tsx`: header (avatar, name, profile link, RA, joined date), total + per-lesson/per-exercise scores from `useClassGradebook`, recent submissions with `StatusBadge` linking to exercise pages, gradebook link, loading/empty states, full width on mobile
- [x] 3.2 Close panel when the selected student leaves the student list (promoted/removed)

## 4. Page layout

- [x] 4.1 Move lessons grid into `class-lessons.tsx`
- [x] 4.2 `class-detail.tsx`: Lessons | People (N) tabs for managers with nuqs `?tab=`; students see lessons only

## 5. i18n, version, verification

- [x] 5.1 Add new `ClassesPage` strings to `messages/en.json` and `messages/pt.json`
- [x] 5.2 Bump `web/package.json` minor version
- [x] 5.3 `bun lint`, `bun test lib`, `bunx tsc --noEmit`
- [x] 5.4 Browser check on `:$DEV_PORT` as teacher (owner) and coteacher: tabs + URL, search, menu actions, panel content vs gradebook; student view has no tabs
