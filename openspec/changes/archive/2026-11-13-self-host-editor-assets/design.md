## Context

`@monaco-editor/react` uses `@monaco-editor/loader`, which by default injects `https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js` and AMD-loads `vs/editor/editor.main`. `CodeEditor` renders `<Editor>`; `HighlightedCode` calls `loader.init()` to use `monaco.editor.colorize`. `monaco-vim` imports `monaco-editor/esm/vs/editor/editor.api`, which `next.config.ts` aliases (Turbopack) to `lib/monaco-global.ts`. That file re-exports the global `monaco` set by the AMD build, so vim and the editor share one instance. Blockly's `inject` defaults `media` to `https://static.blockly.com/media/`.

## Goals / Non-Goals

**Goals:** editor, highlighting and block editor work with only the WhyRunner origin reachable. monaco-vim, Portugol and the theme keep working. No vendored blobs in git.

**Non-Goals:** bundling Monaco's ESM build through Turbopack. Offline/PWA support. Avatars and other images, which already degrade without blocking anything.

## Decisions

- **Serve the AMD `min/vs` build from `/public` instead of bundling ESM `monaco-editor`.** `loader.config({ paths: { vs: "/monaco/vs" } })` keeps the runtime path identical to today's CDN load. Workers resolve from the same origin, the `monaco-global.ts` alias for monaco-vim stays valid, and no Turbopack worker or CSS-import plumbing is needed. Alternative considered: `loader.config({ monaco })` with an ESM import. That needs `new Worker(new URL(...))` handling under Turbopack, client-only dynamic import (Monaco touches `window` at import), and it bundles Monaco into app chunks. More moving parts for the same result.
- **Copy at install/dev/build time, gitignored.** `scripts/copy-static-assets.mjs` copies `node_modules/monaco-editor/min/vs` → `public/monaco/vs` and `node_modules/blockly/media` → `public/blockly/media`. It runs from `postinstall`, `dev` and `build`. Bun doesn't run `pre*` hooks for custom scripts, so the copy is chained into those scripts explicitly. Committing the 16 MB copy would drift from the lockfile on upgrade.
- **One shared `lib/monaco-loader.ts`** calls `loader.config` at module scope. Both Monaco consumers import it, so config always happens before `loader.init()` and the `<Editor>` mount.
- **Pin `monaco-editor` at `0.55.1`** as a direct dependency, the same version the loader's CDN default used, so there's no behavior change.

## Risks / Trade-offs

- [Static files missing in a deploy if the copy step is skipped] → `build` runs the copy itself. Vercel runs `bun run build`.
- [Version skew between `@monaco-editor/react` expectations and `monaco-editor`] → pinned to the loader's own default (0.55.1).
- [Large `public/`] → 16 MB of static files, served cached by Vercel's CDN. Only the editor's needed chunks are fetched at runtime.
