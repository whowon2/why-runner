## Why

Typing in the problems, contests and admin list search boxes lags: the shared `ListPageHeader` input is controlled straight from URL state, so every keystroke runs `router.replace` / a nuqs setter (the contests one with `shallow: false`, i.e. a server round trip), re-renders the page and starts a new list query. Students and teachers feel it most on the problems page.

## What Changes

- `ListPageHeader` keeps the search text in local state, so typing is instant, and calls `search.onChange` once the user stops typing for 300 ms. It resyncs its text when `search.value` changes from outside (Back/Forward, a cleared filter) and skips the call when the debounced text already equals `search.value`.
- New reusable hooks in `web/hooks/use-debounced.ts`: `useDebouncedValue(value, delay)` and `useDebouncedCallback(fn, delay)`.
- The hand-rolled debounces in `ProblemPicker` and `useCoTeacherSearch` use `useDebouncedValue`.
- Page resets to 1 only when the debounced search fires (it already happens inside each `onChange`, which now runs once per pause).
- Audit of other inputs: tag picker filter (local cmdk filter over a fixed small list) and custom theme colors (already rAF-painted and debounced commit) need no change; the workspace custom-input stdin re-rendered the whole workspace on every key, so it moves to a ref read at run time.
- Contests list `q` URL param becomes a shallow nuqs update (the server page never reads it).

## Capabilities

### New Capabilities
- `list-search-input`: the shared list-page search box types without lag and updates the URL/query once per typing pause.

### Modified Capabilities
<!-- none: the problem-list-view search/filter behavior is unchanged apart from timing -->

## Impact

- `web/components/list-page-header.tsx`, `web/hooks/use-debounced.ts` (new), `web/app/[locale]/problems/_components/problem-picker.tsx`, `web/hooks/use-co-teacher-search.tsx`; `web/app/[locale]/contests/_components/list.tsx`, `web/components/code-run/code-run.tsx`, `web/components/workspace/test-cases-panel.tsx`.
- No server, DB or judge changes. `web/package.json` patch bump.
