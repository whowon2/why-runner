## Context

`LessonPage` (`web/app/[locale]/roadmap/[lessonId]/page.tsx`) is a thin wrapper that centers `LessonDetail` in a `max-w-6xl` column. `LessonDetail` renders a fixed 50/50 `grid-cols-2`: left card holds the problem statement, right column holds a Monaco editor fixed at `height={300}` plus a submissions list below it. There is no header outside the problem card, no back link, no lesson-to-lesson navigation. `getRoadmap()` already computes, per user, a flat list of lessons grouped by theme (a lesson can appear in more than one theme group) ordered by the lesson's single global `order` integer column; `getLesson()` returns one lesson plus its own lock/completion state but no sibling info.

Contrast: the problem-workspace page (`web/app/[locale]/problems/_components/workspace/`) gives the editor a full dedicated column with tabs (results/statistics/tests) and no such width constraint — the reference point for "editor deserves more room."

## Goals / Non-Goals

**Goals:**
- Add a page header (title, theme badges, lock/completion state) above the content, decoupled from the problem card.
- Add a back-to-roadmap link/button.
- Add "next lesson" navigation driven by the existing global `order` column — no new schema.
- Give the code editor materially more space: wider column on large screens, taller editor, without turning this into a full workspace rebuild.

**Non-Goals:**
- Reworking the problem-workspace page or unifying it with the lesson page component.
- Per-theme lesson ordering (a lesson's position is defined once, globally, by `order`; "next lesson" is theme-agnostic).
- Changing lock/requirement logic, skill computation, or the submission pipeline.

## Decisions

**Next lesson = next row by global `order`, not next-in-theme.**
A lesson can belong to multiple themes, so "next in theme" is ambiguous (next in Strings vs. next in Arrays may differ). Using the single global `order` column already used for the roadmap's within-theme sort keeps one unambiguous notion of "next" and needs no schema change. Alternative considered: track a separate per-theme cursor client-side from the theme the user arrived from — rejected as unnecessary complexity for a v1 nav affordance.

**Resolve next lesson server-side via a new action, not by shipping the whole roadmap to the client.**
Add `getNextLesson(lessonId)` in `web/lib/actions/lessons/get-lesson.ts` (or a sibling file) that queries the lesson with `order` just above the current lesson's `order` (ties broken by `id`), returns `{ id, problem: { title } } | null`. Wrapped in a `useNextLesson(lessonId)` hook. Alternative considered: extend `getLesson` to embed next-lesson info directly — rejected because `getLesson` is cached under `["lessons", lessonId]` and mixing in a query keyed on global ordering complicates invalidation; a separate small query is cheap and independently cacheable.

**Layout: switch to an explicit two-region page shell, keep `LessonDetail` as the content grid but rebalance columns.**
`page.tsx` gains a header region (title/badges/back button, using data from `useLesson`) and a footer/inline next-lesson action, both outside `LessonDetail`. Inside `LessonDetail`, shift the grid to give the editor column more width (e.g. `lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]` or similar, editor-favoring) and raise the Monaco `height` (e.g. 500–600px, or `h-[60vh]`) instead of the fixed 300px. Alternative considered: stack problem statement above editor full-width — rejected, loses the side-by-side reference/code view that's useful while coding.

**Header lives in `page.tsx`, not inside `LessonDetail`.**
`page.tsx` already fetches nothing today; it will call `useLesson` (or the header will be a new small client component) so the header can render before/independent of the submission-form card, matching "page header" as a page-level concern rather than a card-level one. `LessonDetail` keeps owning the two content columns and drops its current in-card title block (moved up to the header).

**Rewards/requirements reuse existing `getLesson()` fields, rendered near the header.**
`getLesson()` already returns `rewards.themes`; no new query is needed for rewards. Rewards render regardless of lock/completion state (badge row, styled like the roadmap list's reward line). Full requirement display needs one small extension to `getLesson()`'s existing logic: today it only computes `unmetRequirements` (via `getUnmetRequirements`); showing every requirement with a current value means also resolving current values for *met* requirements, so `getLesson()` gains a full `requirements` list (theme/language, minValue, currentValue, met) alongside `unmetRequirements` — same underlying skill lookups, no schema or new query. Alternative considered: keep locked view unmet-only and add a separate "all requirements" block — rejected as redundant; one list with per-row met/unmet state is simpler.

## Risks / Trade-offs

- [Two components (`page.tsx` header and `LessonDetail`) both fetch `useLesson(lessonId)`] → React Query dedupes by query key, so this is a cache hit, not a duplicate network call; acceptable.
- [Larger editor height on short viewports could push submissions list below the fold] → use a viewport-relative height with a sane max (e.g. `min(600px, 60vh)`) rather than a large fixed pixel value.
- [`getNextLesson` exposes a lesson row that may itself be locked for the user] → allowed by design; clicking "next lesson" when locked should land on the lesson page showing its normal locked-state UI (already handled by `LessonDetail`), not be hidden — surfacing locked lessons is consistent with the existing roadmap behavior.

## Open Questions

None — small enough that implementation can resolve remaining specifics (exact Tailwind breakpoints/sizes) during `tasks`.
