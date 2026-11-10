## 1. Portugol grammar

- [x] 1.1 Add `web/lib/monaco-portugol.ts` with an idempotent `registerPortugol(monaco)` (Monarch tokenizer: keywords, types, constants, numbers, strings, comments, operators; language configuration for brackets/comments)
- [x] 1.2 Call `registerPortugol` from `CodeEditor`'s `beforeMount`

## 2. Highlighted code component

- [x] 2.1 Add `web/components/highlighted-code.tsx`: `loader.init()` → `registerPortugol` → define/set `MONACO_THEME` from `buildMonacoTheme(shown, activeMode)` → `colorize`; plain `<pre>` fallback; `translate="no"` + `notranslate` in both states; language map with `plaintext` default

## 3. Call sites

- [x] 3.1 `components/workspace/submission-history.tsx` uses `HighlightedCode` with the submission language
- [x] 3.2 `app/[locale]/classes/_components/lesson-review.tsx` uses `HighlightedCode` (keeps wrap + copy-button padding)
- [x] 3.3 `components/blocks/portugol-code-panel.tsx` uses `HighlightedCode` with `portugol`
- [x] 3.4 Delete unused `components/submissions/latest-verdict.tsx` and any orphan i18n keys only it used

## 4. Verify and ship

- [x] 4.1 `bun run lint` and typecheck pass in `web/`
- [x] 4.2 Browser check on this worktree's `DEV_PORT` (teacher account): submission history (cpp, colors match the editor), lesson review (Python, light and dark), Portugol in the editor and via `colorize` (escaped HTML). Not seen directly: the blocks Portugol panel (no blocks exercise in the teacher's classes) and the brief plain-text state before Monaco loads
- [x] 4.3 Bump `web/package.json` minor version (1.10.0 → 1.11.0 after merging main)
- [x] 4.4 Add a row to `docs/evaluation/post-evaluation-changes.md`
