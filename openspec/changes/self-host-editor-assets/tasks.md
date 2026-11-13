## 1. Asset copy

- [x] 1.1 Add `web/scripts/copy-static-assets.mjs` copying Monaco `min/vs` and Blockly `media` into `public/`
- [x] 1.2 Run it from `postinstall`, `dev` and `build` in `web/package.json`; gitignore `public/monaco/` and `public/blockly/`
- [x] 1.3 Add `monaco-editor@0.55.1` as a direct dependency

## 2. Point consumers at same-origin assets

- [x] 2.1 Add `web/lib/monaco-loader.ts` calling `loader.config({ paths: { vs: "/monaco/vs" } })`; import it from `code-editor.tsx` and `highlighted-code.tsx`
- [x] 2.2 Update the `monaco-global.ts` / `next.config.ts` comments (instance is now self-hosted, not CDN)
- [x] 2.3 Pass `media: "/blockly/media/"` to `Blockly.inject`

## 3. Verify and ship

- [x] 3.1 Typecheck, lint and build pass
- [x] 3.2 In the browser, with jsdelivr/unpkg/static.blockly.com blocked: editor, Portugol highlighting, theme, vim mode, submitted-code highlighting and block editor all work, with no third-party requests
- [x] 3.3 Bump `web/package.json` to 1.11.2 and open a PR
