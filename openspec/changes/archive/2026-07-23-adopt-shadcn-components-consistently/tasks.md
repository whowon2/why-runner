## 1. Pagination consolidation

- [x] 1.1 Add shadcn `Pagination` primitive: `npx shadcn add pagination` in `web/`
- [x] 1.2 Build `web/components/pagination-controls.tsx` wrapper (`page`, `totalPages`, `from`, `to`, `total`, `onPrev`, `onNext` props) built on the new primitive, matching current button styling/disabled states
- [x] 1.3 Replace pagination block in `web/app/[locale]/contests/_components/list.tsx:156-189` with `PaginationControls`
- [x] 1.4 Replace pagination block in `web/app/[locale]/problems/_components/list.tsx:361-393` with `PaginationControls`
- [x] 1.5 Replace pagination block in `web/app/[locale]/user/_components/my-contests.tsx` with `PaginationControls`
- [x] 1.6 Replace pagination block in `web/app/[locale]/user/_components/my-problems.tsx` with `PaginationControls`
- [x] 1.7 Verify all 4 pages in browser (light + dark): page counts, prev/next disabled states, "showing A-B of C" text unchanged

## 2. Empty-state consolidation

- [x] 2.1 Replace manual empty block in `web/app/[locale]/contests/_components/list.tsx:112-136` with `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription`, keeping the existing "clear search" button as content
- [x] 2.2 Replace manual pending-join empty block in `web/app/[locale]/contests/_components/tabs/index.tsx:122-132` with `Empty` composition
- [x] 2.3 Replace plain `<div>{t("noResults")}</div>` in `web/app/[locale]/problems/_components/list.tsx:293-296` with `Empty` composition
- [x] 2.4 Replace plain empty div in `web/app/[locale]/problems/_components/workspace/results.tsx:49-54` with `Empty` composition
- [x] 2.5 Replace plain empty div in `web/app/[locale]/problems/_components/workspace/tests.tsx:69-72` with `Empty` composition — SKIPPED: this div is a "locked download" inline notice, not a zero-items empty state; `Empty`'s full dashed block doesn't fit the pattern
- [x] 2.6 Verify all 5 empty states in browser (light + dark), including that any existing action buttons still work

## 3. Loading-state consolidation

- [x] 3.1 Replace `Loader`+ternary in `web/app/[locale]/problems/_components/create-button.tsx:29` with `LoadingSwap`
- [x] 3.2 Replace `Loader`+ternary in `web/app/[locale]/problems/_components/publish-button.tsx:63` with `LoadingSwap`
- [x] 3.3 Replace `Loader`+ternary in `web/app/[locale]/contests/_components/create/button.tsx:45` with `LoadingSwap`
- [x] 3.4 Replace `Loader`+ternary in `web/app/[locale]/contests/_components/tabs/settings/delete-contest.tsx:43` with `LoadingSwap`
- [x] 3.5 Replace `Loader`+ternary in `web/app/[locale]/contests/_components/tabs/settings/publish-button.tsx:75` with `LoadingSwap`
- [x] 3.6 Replace centered `Loader` list-loading state in `web/app/[locale]/problems/_components/list.tsx:289` with `Skeleton` row placeholders shaped like loaded rows
- [x] 3.7 Verify all 6 loading states in browser (trigger pending state on each button, verify list skeleton renders correctly)

## 4. Divider consolidation

- [x] 4.1 Replace standalone `border-t` divider with `Separator` in `web/app/[locale]/contests/_components/list.tsx:157`
- [x] 4.2 Replace standalone `border-t` divider with `Separator` in `web/app/[locale]/contests/_components/card.tsx:108`
- [x] 4.3 Replace standalone `border-t` divider with `Separator` in `web/app/[locale]/contests/_components/tabs/settings/index.tsx:52` — SKIPPED: this is a rose-tinted accent border marking the danger zone, not a plain divider; `Separator` would lose the color semantics
- [x] 4.4 Replace standalone `border-t` divider with `Separator` in `web/app/[locale]/problems/_components/create.tsx:314`
- [x] 4.5 Replace standalone `border-t` dividers with `Separator` in `web/app/[locale]/user/_components/profile.tsx:223,306`
- [x] 4.6 Replace standalone `border-t` divider with `Separator` in `web/app/[locale]/user/_components/my-contests.tsx:89`
- [x] 4.7 Replace standalone `border-t` divider with `Separator` in `web/components/footer.tsx:20`
- [x] 4.8 Replace standalone `border-t` divider with `Separator` in `web/components/activity-card.tsx:377`
- [x] 4.9 Verify each swapped divider visually (light + dark) — skip any site where the border also functions as a container outline rather than a pure divider

## 5. Final verification

- [x] 5.1 Run `web/` typecheck/lint — typecheck clean; lint has 6 pre-existing failures unrelated to this change (img-element/unused-catch-param warnings in untouched files)
- [x] 5.2 Manually walk through problems list, contests list, user profile (my problems/my contests tabs), and problem workspace in browser to confirm no regressions — verified via Playwright against the running dev server (signed up a throwaway local account since these pages require auth); no console errors from touched components, pagination/empty-state/divider rendering confirmed correct
