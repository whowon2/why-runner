## 1. Implementation

- [x] 1.1 Add optional controlled `open` / `onOpenChange` mode (no trigger) to `EditClassDialog`, `DeleteClassDialog`, `LeaveClassButton`
- [x] 1.2 Rebuild the class detail header: `PageHeader` without action + toolbar (code chip, Gradebook, primary Create assignment, ellipsis menu with Edit / Leave / Delete)
- [x] 1.3 Add `shrink-0` to `PageHeader` icon badge and `min-w-0` + `break-words` to its title block
- [x] 1.4 Add `ClassesPage.moreActions` to `en.json` and `br.json`

## 2. Verify

- [x] 2.1 `bun lint` and `tsc --noEmit` in `web/`
- [x] 2.2 Browser check on `DEV_PORT` with the teacher test account: desktop and 375px, open each menu item's dialog, copy the code
- [x] 2.3 Check `/problems` and `/contests` headers are unchanged

## 3. Ship

- [x] 3.1 Bump `web/package.json` patch version
- [x] 3.2 Open the PR
