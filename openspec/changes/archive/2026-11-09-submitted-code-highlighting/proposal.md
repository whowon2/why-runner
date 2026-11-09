## Why

The professor survey (P12, classroom test 2026-10-29) found submitted code hard to read outside the editor. Read-only code views (submission history, the teacher's lesson review, the generated Portugol panel) show plain monochrome text, while the editor highlights the same code. Highlighting them with the editor's own grammar and theme makes reviewing answers faster and keeps one look across the app. Portugol, the language of block exercises and intro classes, has no Monaco grammar at all, so it is plain text even in the editor.

## What Changes

- New shared `HighlightedCode` component: renders read-only code highlighted by `monaco.editor.colorize` (Monaco loaded through the `@monaco-editor/react` loader, same CDN instance as `CodeEditor`), colored by the app theme (`buildMonacoTheme` / `MONACO_THEME`). No editor instance per block. Shows the plain text until Monaco loads (or if it fails). Keeps `translate="no"` + `notranslate`.
- Use it in: workspace submission history, the teacher's lesson review (submitted answers), the generated Portugol panel of block exercises.
- New Portugol Monarch grammar (keywords, types, literals, comments, strings, operators) registered once on the Monaco instance, so both `CodeEditor` and `HighlightedCode` highlight Portugol.
- Remove the unused `LatestVerdict` component (`components/submissions/latest-verdict.tsx`): nothing imports it since the workspace shell replaced it (da31b75); the actions panel shows the latest verdict now.

## Capabilities

### New Capabilities
- `submitted-code-highlighting`: read-only code views highlight code with the editor's grammar and theme, with plain-text fallback; Portugol has a grammar in both the editor and read-only views.

### Modified Capabilities
<!-- None: translation-safe-rendering already requires translate="no" on submitted-code views and the Portugol panel; this change keeps it. editor-latest-verdict is met by the workspace actions panel, not the removed component. -->

## Impact

- `web/components/highlighted-code.tsx` (new), `web/lib/monaco-portugol.ts` (new), `web/components/code-editor.tsx` (register Portugol in `beforeMount`).
- Call sites: `web/components/workspace/submission-history.tsx`, `web/app/[locale]/classes/_components/lesson-review.tsx`, `web/components/blocks/portugol-code-panel.tsx`.
- Deleted: `web/components/submissions/latest-verdict.tsx`.
- No DB, API or judge changes. Web minor version bump (feature).
