## Why

On 2026-11-12 a teacher ran an exam in a lab whose firewall allowed only the WhyRunner domain and SUAP. The code editor never loaded: `@monaco-editor/react`'s loader fetches Monaco from `cdn.jsdelivr.net` by default, so the solution editor and submitted-code highlighting stayed blank. Blockly also loads its sprites, sounds and cursors from `static.blockly.com`. Students have to be able to work with only the WhyRunner origin reachable.

## What Changes

- Serve Monaco's `min/vs` build from the app's own origin (`/monaco/vs`) and point the loader at it, for both `CodeEditor` and `HighlightedCode`.
- Serve Blockly's `media/` from the app's own origin (`/blockly/media/`) and pass it to `Blockly.inject`.
- Copy both from `node_modules` into `web/public/` with a script that runs on install, dev and build. The copies are gitignored, so they always match the installed package versions.
- Make `monaco-editor` a direct, pinned dependency (it was only resolved as a peer), since the served files now come from it.
- Audit the other runtime fetches students depend on. `next/font` (Geist Mono) is self-hosted at build time, KaTeX CSS and fonts are bundled from the `katex` package, and there's no analytics script. Profile avatars (dicebear, Google, GitHub, Vercel Blob) are plain `<img>`s that degrade without blocking anything. None of these need a change.

## Capabilities

### New Capabilities
- `same-origin-assets`: the code editor, read-only code highlighting and the block editor load every runtime asset they need from the WhyRunner origin, so they work behind a firewall that allows only that origin.

### Modified Capabilities

## Impact

- `web/lib/monaco-loader.ts` (new), `web/components/code-editor.tsx`, `web/components/highlighted-code.tsx`, `web/components/blocks/block-workspace.tsx`
- `web/scripts/copy-static-assets.mjs` (new), `web/package.json` scripts and deps, `web/.gitignore`
- Deploy: about 16 MB of extra static files under `public/monaco/vs`. Vercel serves them from its CDN on the same domain.
- Version: web 1.14.2 → 1.14.3 (patch).
