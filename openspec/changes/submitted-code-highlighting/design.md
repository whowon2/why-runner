## Context

`CodeEditor` loads Monaco from the CDN through the `@monaco-editor/react` loader and colors it with `buildMonacoTheme(shown, activeMode)` under the name `MONACO_THEME`, redefined on every theme change. Read-only code views render a plain `<pre translate="no" class="notranslate">`. Submission `language` values are the Drizzle enum (`c`, `cpp`, `java`, `python`, `portugol`, `rust`); all but `portugol` are Monaco built-in grammar ids, and the editor passes the enum value straight as the Monaco language. Monaco has no Portugol grammar, so Portugol is plain text even in the editor. `next.config.ts` aliases `monaco-editor`'s API to the global instance, so no runtime `monaco-editor` import is allowed elsewhere.

## Goals / Non-Goals

**Goals:**
- Same tokens and colors in read-only views as in the editor, following live theme changes (preset, custom theme preview, light/dark).
- One cheap DOM block per view: no editor instance, no layout/resize cost.
- Plain text renders immediately (SSR and before Monaco loads), so content never waits on the CDN.
- Portugol highlighted in the editor and read-only views.

**Non-Goals:**
- Line numbers, folding, selection behavior beyond a normal `<pre>`.
- Highlighting other read-only surfaces (test-case I/O, similarity side-by-side, problem markdown code blocks).
- A full Portugol language service (completion, diagnostics).

## Decisions

- **`monaco.editor.colorize` via `loader.init()`** over mounting a read-only `Editor` per block (heavy, many instances in the lesson review list) or adding Shiki/Prism (second grammar set and theme mapping that drifts from the editor). `colorize` returns escaped HTML with `mtk*` classes whose CSS Monaco injects for the active theme, so the component defines and sets `MONACO_THEME` before colorizing. `loader.init()` is memoized by the loader, so many blocks share one load.
- **Fallback = the same `<pre>` with raw text**; swap to `dangerouslySetInnerHTML` only when colorize resolves. Safe because `colorize` HTML-escapes the source. On load failure, stay on plain text.
- **Language map** in the component: enum value → Monaco id, unknown/null → `plaintext`. Keeps a later enum addition from throwing.
- **Portugol Monarch grammar in `lib/monaco-portugol.ts`**, exported `registerPortugol(monaco)` that is idempotent (checks `monaco.languages.getLanguages()`), called from `CodeEditor`'s `beforeMount` and from `HighlightedCode` before colorize. Keywords from `lib/similarity/languages.ts` `PORTUGOL_KEYWORDS` split into keywords / types / constants for distinct colors; `//` and `/* */` comments, `"` and `'` strings, numbers, operators. Only the type is imported from `monaco-editor` (type-only import, erased at build).
- **Delete `LatestVerdict`** rather than updating it: no importer since the workspace shell; the actions panel owns the verdict.
- **Wrapping stays per call site** via `className` (lesson review keeps `whitespace-pre-wrap break-all`, others `whitespace-pre`); `colorize` emits `<br/>` line breaks so both work.

## Risks / Trade-offs

- [`setTheme` is global] → Every caller sets the same `MONACO_THEME` built from the same tokens, so no conflict with open editors.
- [Theme change re-colorizes every block] → Cheap for submission-sized code; effect deps are `code`, language, `shown`, `activeMode`.
- [Portugol grammar incomplete for exotic syntax] → Unknown text falls back to default foreground; no functional impact.
- [CDN unreachable] → Plain text fallback, same as today.
