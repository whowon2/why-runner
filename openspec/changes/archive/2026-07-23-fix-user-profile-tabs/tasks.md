## 1. Add shadcn Empty component

- [x] 1.1 Run `npx shadcn add empty` (or manually add per shadcn docs) to create `web/components/ui/empty.tsx`
- [x] 1.2 Verify it builds/renders with a throwaway usage, then remove the throwaway

## 2. Rename and relabel tabs

- [x] 2.1 Update `web/app/[locale]/user/_components/tabs.tsx` trigger labels/values to Posts, Contests, Problems (keep `tab` query param values stable or update all internal links that reference `?tab=contests`/`?tab=problems`, e.g. `contests/_components/list.tsx`'s "myContests" link and any `?tab=edit`-style deep links)
- [x] 2.2 Update/add translation keys for the three tab labels in `pt` and `en` message files

## 3. Posts tab (feed.tsx)

- [x] 3.1 Remove the page-level title/subtitle header block and the "caught up" flame footer from `web/app/[locale]/user/_components/feed.tsx`
- [x] 3.2 Replace the current empty-state markup with the shadcn `Empty` component
- [x] 3.3 Add owner vs. visitor copy variants for the empty state, gated on the existing `isOwner` prop (thread `isOwner` into `Feed` if not already passed)
- [x] 3.4 Add/update translation keys: `emptyTitleOwner`, `emptyTitleVisitor`, `emptyDescriptionOwner`, `emptyDescriptionVisitor` under the Posts namespace, `pt` and `en`

## 4. Contests tab (my-contests.tsx)

- [x] 4.1 Rewrite `web/app/[locale]/user/_components/my-contests.tsx` to render `ContestCard` (from `contests/_components/card.tsx`) per contest, matching `ContestList`'s card treatment
- [x] 4.2 Add pagination (page/pageSize state + prev/next controls) matching `ContestList`'s pattern, calling `useContests({ userId, my: true, page, pageSize })`
- [x] 4.3 Replace the hand-rolled empty `Card` block with the shadcn `Empty` component, with owner vs. visitor copy (owner sees a create-contest action, visitor does not)
- [x] 4.4 Add/update translation keys for owner/visitor empty copy under the Contests namespace, `pt` and `en`

## 5. Problems tab (my-problems.tsx)

- [x] 5.1 Rewrite `web/app/[locale]/user/_components/my-problems.tsx` to render a `Table` with the same column set as `ProblemsList` (title+badges, solvedByCount, solved-by-me), dropping the redundant creator column
- [x] 5.2 Add pagination matching `ProblemsList`'s pattern, calling `useProblems({ userId, page, pageSize })`
- [x] 5.3 Replace the hand-rolled empty `Card` block with the shadcn `Empty` component, with owner vs. visitor copy (owner sees a create-problem action, visitor does not)
- [x] 5.4 Add/update translation keys for owner/visitor empty copy under the Problems namespace, `pt` and `en`

## 6. Verification

- [x] 6.1 Run `bun lint` in `web/` (preexisting unrelated errors only, none in touched files)
- [ ] 6.2 Manually verify in the dev server: own profile shows Posts/Contests/Problems tabs correctly scoped, with owner create actions on empty states
- [ ] 6.3 Manually verify another user's profile (`/user/[username]`) shows that user's data only, tab labels correct, and visitor-only empty copy with no create actions
- [ ] 6.4 Verify draft contests/problems still only show to their own creator (not exposed to other viewers) after the rewrite
