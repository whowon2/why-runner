## 1. Theme data model

- [x] 1.1 Define `TokenKey` union and `ThemeTokens` type (`background`, `main`, `text`, `sub`, `caret`, `error`, mapped onto `--background`, `--primary`, `--foreground`, `--muted`, `--ring`, `--destructive`) in `web/lib/themes/types.ts`
- [x] 1.2 Build the preset catalog (5-10 presets incl. `linux rice` as default, each with `light` and `dark` token maps matching current `globals.css` values for `linux rice`) in `web/lib/themes/presets.ts`
- [x] 1.3 Add hex-color validation helper (`web/lib/themes/validate.ts`) for the custom editor

## 2. Runtime theme application

- [x] 2.1 Create `web/lib/themes/apply-theme.ts` with a function that sets CSS custom properties on `document.documentElement` from a `ThemeTokens` object
- [x] 2.2 Create `web/lib/themes/storage.ts` for reading/writing the `why-runner:theme` localStorage key (JSON-encoded `{ mode, presetId?, custom? }`)
- [x] 2.3 Add `ThemeTokensProvider` client component (`web/providers/theme-tokens-provider.tsx`) that applies the persisted theme on mount and exposes a context for reading/setting the active theme
- [x] 2.4 Add a blocking inline `<script>` (in `app/[locale]/layout.tsx`, alongside the existing `next-themes` setup) that reads localStorage and sets CSS vars before first paint, to avoid theme-flash
- [x] 2.5 Wire `ThemeTokensProvider` into `web/providers/index.tsx`

## 3. Settings page shell

- [x] 3.1 Add `app/[locale]/settings/page.tsx` (server component, auth-gated via `getCurrentUser()`, redirect to signin if unauthenticated)
- [x] 3.2 Add `app/[locale]/settings/_components/settings-nav.tsx` with a section list (Appearance as the only working entry for now, structured so more sections can be added later)
- [x] 3.3 Add `app/[locale]/settings/_components/appearance-section.tsx` client component shell with the preset/custom segmented control (using `components/ui/tabs.tsx` or a button-group)

## 4. Preset picker UI

- [x] 4.1 Add `app/[locale]/settings/_components/preset-grid.tsx` rendering a swatch per catalog preset (label + background/foreground/accent colors drawn from that preset's active light/dark set)
- [x] 4.2 Wire swatch click to `ThemeTokensProvider`'s setter (mode: "preset") and persist via `storage.ts`
- [x] 4.3 Mark the active preset as selected in the grid

## 5. Custom theme editor UI

- [x] 5.1 Add `app/[locale]/settings/_components/custom-theme-form.tsx` with one labeled row per `TokenKey`: hex text `Input` + native `<input type="color">` swatch
- [x] 5.2 Wire field changes to live-apply via `ThemeTokensProvider` (mode: "custom") on valid hex input only, using the validation helper from 1.3
- [x] 5.3 Persist custom token map via `storage.ts` on each valid change
- [x] 5.4 Seed the custom form's initial values from the currently active preset/custom theme when switching into "custom" mode

## 6. Integration and polish

- [x] 6.1 Verify existing light/dark toggle (`components/user-dock.tsx`) still works unmodified alongside preset/custom selection
- [x] 6.2 Verify no flash of default theme on hard reload for both preset and custom selections
- [x] 6.3 Add `messages/en` and `messages/pt` i18n strings for the settings page and appearance section
- [x] 6.4 Run `bun lint` and fix issues in new files
