## 1. Comparator

- [x] 1.1 Add `web/lib/compare-by-name.ts` (`Intl.Collator("pt-BR", { sensitivity: "base" })`, username tiebreak)
- [x] 1.2 Add `web/lib/compare-by-name.test.ts` covering case, accents and tiebreak

## 2. Call sites

- [x] 2.1 `get-class.ts`: sort students and co-teachers with `compareByName` instead of `joinedAt`
- [x] 2.2 `gradebook.ts` and `class-results.ts`: use `compareByName`

## 3. Verify and release

- [x] 3.1 Run tests, lint and typecheck in `web/`
- [x] 3.2 Run the app on this worktree's `DEV_PORT`, check class page roster and gradebook order in the browser with a teacher test account
- [x] 3.3 Bump `web/package.json` patch version
- [x] 3.4 Add a row to `docs/evaluation/post-evaluation-changes.md`
