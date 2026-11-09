## 1. Portugol grammar

- [ ] 1.1 Add `web/lib/monaco-portugol.ts` with an idempotent `registerPortugol(monaco)` (Monarch tokenizer: keywords, types, constants, numbers, strings, comments, operators; language configuration for brackets/comments)
- [ ] 1.2 Call `registerPortugol` from `CodeEditor`'s `beforeMount`

## 2. Highlighted code component

- [ ] 2.1 Add `web/components/highlighted-code.tsx`: `loader.init()` → `registerPortugol` → define/set `MONACO_THEME` from `buildMonacoTheme(shown, activeMode)` → `colorize`; plain `<pre>` fallback; `translate="no"` + `notranslate` in both states; language map with `plaintext` default

## 3. Call sites

- [ ] 3.1 `components/workspace/submission-history.tsx` uses `HighlightedCode` with the submission language
- [ ] 3.2 `app/[locale]/classes/_components/lesson-review.tsx` uses `HighlightedCode` (keeps wrap + copy-button padding)
- [ ] 3.3 `components/blocks/portugol-code-panel.tsx` uses `HighlightedCode` with `portugol`
- [ ] 3.4 Delete unused `components/submissions/latest-verdict.tsx` and any orphan i18n keys only it used

## 4. Verify and ship

- [ ] 4.1 `bun run lint` and typecheck pass in `web/`
- [ ] 4.2 Browser check on this worktree's `DEV_PORT`: submission history (student), lesson review (teacher), Portugol panel + Portugol editor, light/dark switch, plain text before load
- [ ] 4.3 Bump `web/package.json` minor version
- [ ] 4.4 Add a row to `docs/evaluation/post-evaluation-changes.md`
