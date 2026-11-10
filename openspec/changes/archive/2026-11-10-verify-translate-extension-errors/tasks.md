## 1. Reproduce

- [x] 1.1 Start the web app on this worktree's `DEV_PORT` (3005) and log in with the local student/teacher test accounts in Helium
- [x] 1.2 Translate a lesson exercise page with the translate extension; write, run and submit code; read console errors
- [x] 1.3 Translate a problem page; run custom input, submit, open submission history/verdict; read console errors
- [x] 1.4 Switch site locale while the page is translated; read console errors

## 2. Fix (only if a crash reproduced)

- [x] 2.1 Identify the component from the error/component stack and the bare dynamic text involved
- [x] 2.2 Wrap the dynamic text in elements or mark the region `translate="no"`; re-run 1.2–1.4 to confirm no error
- [x] 2.3 Run `bun lint` and `bun typecheck` (or `tsc --noEmit`) in `web/`
- [x] 2.4 Bump `web/package.json` patch version
- [x] 2.5 Scan the app for the other crash shapes (conditional before bare text, conditional bare text, same-tag ternaries with different children) and wrap their text in elements
- [x] 2.6 Confirm with a jsdom harness that the pre-fix `SolveStatus`/`MatchBadge` crash under text rewriting and the fixed ones don't

## 3. Docs

- [x] 3.1 Add a P9 row to `docs/evaluation/post-evaluation-changes.md` with the verification result
- [x] 3.2 Archive the change
