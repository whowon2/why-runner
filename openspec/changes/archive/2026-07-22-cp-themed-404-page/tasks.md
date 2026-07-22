## 1. Copy & i18n

- [x] 1.1 Draft themed copy for `NotFound` namespace: verdict/status label, 2-3 mock log/error lines, updated title/description, CTA label (en)
- [x] 1.2 Translate the same keys into pt-BR, matching existing tone of `br.json`
- [x] 1.3 Update `web/messages/en.json` `NotFound` block with new keys
- [x] 1.4 Update `web/messages/br.json` `NotFound` block with new keys

## 2. Styling foundation

- [x] 2.1 Check rendered appearance of Tailwind's default `font-mono` stack for the log block in both light and dark theme; if unsatisfactory, add `--font-mono: var(--font-geist-mono)` to the `@theme` block in `web/app/globals.css`

## 3. Component implementation

- [x] 3.1 Rebuild `web/app/[locale]/not-found.tsx` using the `my-problems.tsx` empty-state shell (dashed-border `Card`, icon badge, `CardTitle`/`CardDescription`, gradient-glow CTA `Button`) as the structural base
- [x] 3.2 Swap icon to an error-toned lucide icon (e.g. `Bug` or `TerminalSquare`) with red/orange badge colors, distinct from the indigo used in the "no problems yet" state
- [x] 3.3 Add the monospace verdict/log block (status chip + 2-3 log lines) inside the card, sourced from the new `NotFound` translation keys
- [x] 3.4 Wire the CTA button to navigate home via `Link` from `@/i18n/navigation`, preserving current behavior
- [x] 3.5 Verify `getTranslations("NotFound")` usage still matches the updated key names

## 4. Verification

- [x] 4.1 Run `bun dev` (or existing web dev script) and visit a nonexistent route under `/en/...` to visually check layout, spacing, and contrast
- [x] 4.2 Repeat the check under `/br/...` to confirm localized copy renders correctly
- [x] 4.3 Toggle light/dark theme and confirm the log block and verdict chip remain legible in both
- [x] 4.4 Confirm the CTA button correctly navigates to the home route
- [x] 4.5 Run `bun lint` / `bun typecheck` (or equivalent existing scripts) in `web/` to confirm no regressions
