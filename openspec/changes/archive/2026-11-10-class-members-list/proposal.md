## Why

The teacher view of a class page shows co-teachers and students as plain name rows above the lessons. Each row's two unlabeled icon buttons sit far to the right, with no row dividers, so it is hard to tell which student a button belongs to. The rows have no avatars or usernames, and the sections have no counts or search. A long roster pushes the lessons, the page's main content, off screen. A teacher also can't see how one student is doing without opening the gradebook and finding the right row.

## What Changes

- The class page for managers gets **Lessons | People (N)** tabs. Lessons is the default, and the active tab is kept in the URL (`?tab=people`). Students still see only the lessons, with no tabs.
- Roster rows show an avatar (image or initials), the name, `@username`, the RA for students, and the Owner/Co-teacher badges. Rows have dividers and a hover background so each row's actions read as part of that row.
- The Teachers and Students headings show counts. A client-side search filters students by name, `@username` or RA, with an empty state when nothing matches.
- A per-row "⋯" menu replaces the separate role and remove icon buttons. It offers Make co-teacher / Make student (owner-level only) and Remove, and Remove still asks for confirmation. Permissions are unchanged.
- Clicking a student row opens a side panel (Sheet) with:
  - the student's header (avatar, name, profile link, RA, joined date);
  - total score, plus per-lesson totals with per-exercise scores (the same numbers as the gradebook);
  - the student's latest submissions in this class, with status badges;
  - a link to the gradebook.
- `getClass` also returns each student's membership `joinedAt`.
- New manager-only server action that lists a student's recent lesson-exercise submissions in a class.
- `web/package.json` gets a minor version bump.

## Capabilities

### New Capabilities
- `class-roster`: how the manager-facing class roster is presented. Covers the Lessons/People tabs, row content, counts, student search, row action menu, and the per-student side panel with scores and recent submissions.

### Modified Capabilities
- `class-coteachers`: in the "Co-teacher UI" requirement, per-member actions now live in a row action menu inside the People tab instead of standalone icon buttons. The permissions are unchanged.

## Impact

- `web/app/[locale]/classes/_components/`: `class-detail.tsx` (gets tabs, then gets split into roster components), `member-role-button.tsx` and `remove-member-button.tsx` (replaced by a row menu), a new student side-panel component. `add-co-teacher-dialog.tsx` is unchanged except where its trigger sits.
- `web/lib/actions/classes/get-class.ts`: returns `joinedAt` for students.
- New `web/lib/actions/classes/get-class-student-submissions.ts` and a `web/hooks/` query hook.
- Reuses `useClassGradebook` for the panel's scores. No new score logic.
- `web/messages/{pt,en}.json`: new `ClassesPage` strings.
- No DB migration. No judge changes.
