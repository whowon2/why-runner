## Why

The lesson page (`/roadmap/[lessonId]`) wastes its available width: a fixed two-column grid caps the layout at `max-w-6xl` with no page header, no way to navigate back to the roadmap, and no way to move to the next lesson without leaving the page. The code editor — the primary interaction — is boxed into a half-width column at a fixed 300px height, cramped compared to the problem-workspace editor used elsewhere in the app.

## What Changes

- Add a page header to the lesson page showing the lesson title, theme badges, and completion/lock state (currently buried inside the content card).
- Add a back button that returns to the roadmap (and preserves the originating theme section where feasible).
- Add a "next lesson" action that navigates to the next incomplete/unlocked lesson in sequence, shown when the current lesson is completed or otherwise resolved.
- Rework the lesson page layout so the code editor gets materially more space (wider column and/or taller editor, similar proportions to the problem-workspace page) instead of a fixed 300px box in a 50/50 grid.
- Add a server action (or extend `getRoadmap`/`getLesson`) to resolve "next lesson" given a lesson id, respecting theme grouping and order.
- Lesson page now also surfaces lesson rewards (always) and full requirement list (not just unmet-when-locked), mirroring roadmap list card.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `learning-roadmap`: lesson page presentation requirements change — a page header, back-to-roadmap navigation, and next-lesson navigation are now required parts of the lesson page; the requirement covering lesson display is extended to cover page-level layout/navigation, not just card content.

## Impact

- `web/app/[locale]/roadmap/[lessonId]/page.tsx` — add header/back/next chrome around `LessonDetail`.
- `web/app/[locale]/roadmap/_components/lesson-detail.tsx` — restructure grid/editor sizing.
- `web/lib/actions/lessons/get-lesson.ts` / `get-roadmap.ts` — expose data needed to resolve next lesson (theme order, sibling lessons).
- `web/hooks/use-lesson.tsx` (and possibly a new hook) — fetch next-lesson info.
- `web/messages/*.json` — new i18n strings (back, next lesson).
- No DB schema changes.
