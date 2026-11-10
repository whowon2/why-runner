## Context

`class-detail.tsx` renders the whole manager view in one component: the header, then a Teachers card, a Students card, and the lesson cards. Each roster row uses `MemberRoleButton` (graduation-cap/user icon) and `RemoveMemberButton` (user-minus icon, AlertDialog) as separate ghost icon buttons, right-aligned and far from the name. `getClass` already returns the owner, co-teachers and students (`publicUserColumns` + `ra`, sorted with `compareByName`). The membership's `joinedAt` is in the DB but not selected. `getClassGradebook` / `useClassGradebook` already compute per-student lesson totals and exercise cells with the same scoring as lesson review. Submissions link to exercises through `submission.exerciseId` → `exercise.lessonId` → `lesson.classroomId`.

## Goals / Non-Goals

**Goals:**
- Lessons are no longer buried under the roster: managers get Lessons/People tabs.
- Rows show who each member is at a glance, and each row's actions clearly belong to that row.
- A teacher can see one student's progress (scores and recent submissions) without leaving the class page.

**Non-Goals:**
- No change to the permission rules or the add-co-teacher dialog's behaviour.
- No new score formula and no per-student copy of gradebook logic.
- No server-side pagination or search of the roster. Classes are tens of students, so filtering on the client is enough.
- No viewing of submission code inside the panel. Rows link to the exercise page.

## Decisions

1. **Tabs via the shadcn `Tabs` component and nuqs `useQueryState("tab", parseAsStringLiteral(["lessons","people"]).withDefault("lessons"))`.** This follows the repo's convention of keeping URL state in nuqs (see `admin-list.tsx`). The alternative was to put the rosters below the lessons, but the user chose tabs.
2. **Split `class-detail.tsx`.** The roster moves to `class-people.tsx`, which holds the Teachers card, the Students card with search, and the selected-student state. Each row is a `member-row.tsx` and each menu a `member-actions-menu.tsx`. The lessons grid moves to `class-lessons.tsx`. This keeps each file focused. `MemberRoleButton` and `RemoveMemberButton` are removed. The remove confirmation becomes a controlled `AlertDialog` that the menu opens, because an AlertDialog nested inside a DropdownMenu item closes along with the menu.
3. **The row is a button that opens the Sheet. The profile link moves into the panel.** A row-wide click target is easy to hit on mobile. The `⋯` trigger calls `stopPropagation`. Teacher rows don't open a panel, since they have no scores.
4. **The panel's scores come from `useClassGradebook(classroomId)`.** The panel finds the student's row with `rows.find(r => r.student.id === userId)`. It renders the totals with the existing `formatScore`. It runs the same query and uses the same cache key as the gradebook page, so the numbers can't disagree, and opening a second student doesn't refetch.
5. **New action `getClassStudentSubmissions(classroomId, userId)`** in `lib/actions/classes/`:
   - It checks `assertCanManageClass`, validates `classroomId` as `z.uuid()` and `userId` as a non-empty string (Better Auth ids are not UUIDs), and confirms that `userId` is a student of the class.
   - The query joins `submission` → `exercise` → `lesson` where `lesson.classroomId = id`, `submission.userId = userId` and `status <> 'CANCELED'`, ordered by `createdAt desc` with a limit of 10.
   - It selects only id, status, language, createdAt, exercise slug/problem title and lesson slug/title. No output or code is selected, so `redactReport` isn't needed.
   - The hook `useClassStudentSubmissions` uses the key `["classes", classroomId, "students", userId, "submissions"]`. That key sits under the `["classes"]` prefix, so `invalidateClassRoster` and other class-level invalidations already cover it.
6. **`getClass` adds `joinedAt` to each student** by mapping `{ ...m.user, joinedAt: m.joinedAt }`.
7. **Search uses a small pure helper `matchesMemberQuery(member, query)`** in `lib/`. It normalizes with NFD, strips diacritics, lowercases, and strips a leading `@`. The helper gets a Bun unit test, following the repo's "pure modules only" testing rule.
8. **Mutations:** the existing `useSetMemberRole` and `useRemoveMember` already call `invalidateClassRoster`. If the student whose panel is open is promoted or removed, the panel closes, because the selected id is no longer in `members`.

## Risks / Trade-offs

- [The gradebook query is heavier than the class query, and it loads every student when the panel opens] → It runs only on the first panel open and is cached afterwards. Class sizes are small.
- [Recent submissions can go stale while the panel is open] → React Query refetches on window focus by default. Accepted.
- [Removing the separate icon buttons changes muscle memory for existing teachers] → The menu labels are explicit, so it's a net clarity gain.

## Migration Plan

UI and read-only action only. No migration. Rolling back means reverting the PR.

## Open Questions

None.
