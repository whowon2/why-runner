## 1. Language switcher component

- [x] 1.1 Create `web/components/language-switcher.tsx` (client): ghost icon button with `Globe`, `DropdownMenu` listing `routing.locales` labelled via `Languages.portuguese` / `Languages.english`, `Check` on the active locale (`useLocale`)
- [x] 1.2 On select, skip if locale unchanged; otherwise `router.replace` to current `usePathname()` with current `useSearchParams()` preserved, under the new locale
- [x] 1.3 Add tooltip using `Languages.placeholder` (matches other dock icons)

## 2. Dock and avatar menu

- [x] 2.1 Render `<LanguageSwitcher />` in `web/components/user-dock.tsx` next to the theme toggle, outside the `session ?` branch
- [x] 2.2 Remove the language `DropdownMenuSub` and `handleLocaleChange` from `web/components/header/avatar-button.tsx`, dropping now-unused imports

## 3. Verify

- [x] 3.1 `bun lint` and `bun run build` in `web/` pass (no `useSearchParams` CSR-bailout error; wrap in `<Suspense>` if needed)
- [x] 3.2 Signed out on `/en/auth/signin?redirect=...`: switch to Portuguese → lands on `/br/auth/signin?redirect=...`, UI in Portuguese
- [x] 3.3 Signed out: after switching, open `/` → redirected to `/br` (NEXT_LOCALE cookie persists choice)
- [x] 3.4 Signed in: switcher works from dock; avatar dropdown no longer shows a language submenu
