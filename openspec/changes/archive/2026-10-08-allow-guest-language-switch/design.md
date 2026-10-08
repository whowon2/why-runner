## Context

Locales are routed by `next-intl` (`web/i18n/routing.ts`: `["en", "br"]`, default `en`) through the middleware in `web/proxy.ts`. The only UI that changes locale is `AvatarButton`'s "Language" submenu, which calls `router.replace(pathname, { locale })`. `UserDock` renders `AvatarButton` only inside its `session ? … : <login button>` branch, so guests have no way to switch.

## Goals / Non-Goals

**Goals:**
- Guests and signed-in users can switch locale from the dock.
- One shared component for the switcher; no duplicated locale logic.

**Non-Goals:**
- Storing a per-user locale preference in the DB.
- Adding new locales or translating missing strings.
- Fixing the hard-coded `<html lang="en">` in `app/[locale]/layout.tsx` (worth a separate change).

## Decisions

- **New `LanguageSwitcher` client component in `web/components/language-switcher.tsx`.** A `DockIcon`-sized ghost button with the `Globe` icon opens a `DropdownMenu` listing `Languages.portuguese` / `Languages.english`, with a `Check` on the active locale. Mirrors the existing `NotificationBell`/theme-toggle look. *Alternative:* keep it inside the avatar menu and also render a guest-only button — rejected, two code paths for one action.
- **Placed next to the theme toggle, outside the session branch** in `UserDock`, so both "preference" controls sit together and render for everyone.
- **Navigation via `next-intl` `useRouter().replace(pathname, { locale })`, carrying search params.** `usePathname()` from `@/i18n/navigation` excludes the query string, so read `useSearchParams()` and pass `{ pathname, query }` (or append the string) — otherwise `?redirect=…` on the sign-in page is lost, regressing commit `4caa103`. *Alternative:* plain `<a href>` swap of the prefix — rejected, causes full reload.
- **Persistence relies on next-intl's `NEXT_LOCALE` cookie**, which the middleware sets when a locale-prefixed route is served. No extra code needed; verify during implementation.
- **Remove the submenu from `AvatarButton`** along with `useRouter`/`usePathname`/`useLocale` imports it no longer needs.

## Risks / Trade-offs

- [Dock gets one more icon for guests; tight on narrow phones] → Guest dock currently has fewer items than signed-in (no bell/settings/avatar), so net width is still below the signed-in dock.
- [`useSearchParams` in a client component needs a Suspense boundary for static rendering] → Dock already renders client-only after mount (`mounted` guard); confirm build has no CSR-bailout error, else wrap in `<Suspense>`.
- [Users used to the avatar submenu won't find it there] → Globe icon is visible directly in the dock; acceptable.
