## 1. Implementation

- [x] 1.1 Move `CreateClassButton` out of the header in `class-list.tsx`: beside the "myClasses" heading when taught > 0, dashed hint box otherwise
- [x] 1.2 Add `ClassesPage.teachHint` to `web/messages/en.json` and `web/messages/br.json`

## 2. Verification

- [x] 2.1 `bun lint` and `bun typecheck` (or `tsc --noEmit`) pass in `web/`
- [x] 2.2 Browser check on DEV_PORT: teacher account sees button by heading; student account sees hint box; `?createClass=1` creates one class

## 3. Release

- [x] 3.1 Bump `web/package.json` patch version
- [x] 3.2 Add row to `docs/evaluation/post-evaluation-changes.md`
