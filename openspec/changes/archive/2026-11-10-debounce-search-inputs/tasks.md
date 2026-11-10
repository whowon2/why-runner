## 1. Hooks

- [x] 1.1 Add `web/hooks/use-debounced.ts` with `useDebouncedValue` and `useDebouncedCallback` (stable, latest-fn ref, cancel/flush, cleanup on unmount)
- [x] 1.2 Refactor `ProblemPicker` and `useCoTeacherSearch` to `useDebouncedValue`

## 2. List search

- [x] 2.1 `ListPageHeader`: local text state, debounced (300 ms) `search.onChange`, Enter flushes, resync on external `search.value` change
- [x] 2.2 Confirm problems/contests/admin list queries keep `keepPreviousData` and reset page only inside the debounced `onChange`
- [x] 2.3 Contests `q` param: drop `shallow: false` (server page never reads it; a timer-fired non-shallow nuqs update left the RSC transition hanging and the list unfiltered)

## 3. Audit

- [x] 3.1 Check tag picker, custom theme form, and workspace stdin for per-keystroke expensive work; fix stdin if measurable (measured 8.2 ms → 0.8 ms median per key in dev after moving stdin to a ref)

## 4. Verify and ship

- [x] 4.1 Browser check on DEV_PORT: smooth typing, one request after typing stops, Back/Forward syncs input
- [x] 4.2 `bun lint`, typecheck, `bun test lib`
- [x] 4.3 Bump `web/package.json` patch version
