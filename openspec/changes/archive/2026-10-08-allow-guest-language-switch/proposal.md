## Why

The only language picker lives in the avatar dropdown (`components/header/avatar-button.tsx`), which the dock renders only when a session exists. Signed-out visitors — including anyone landing on the sign-in or onboarding pages — are stuck with whatever locale the URL/Accept-Language gave them and cannot switch between Portuguese and English before logging in.

## What Changes

- Add a standalone language switcher (globe icon + dropdown with Portuguese / English) to the dock, rendered for every visitor regardless of session state.
- Remove the language submenu from the avatar dropdown so there is a single, consistent place to change language.
- Switching keeps the user on the current page (same pathname + search params), only swapping the locale prefix — same behavior the avatar menu has today.

## Capabilities

### New Capabilities
- `language-switching`: Any visitor, signed in or not, can change the UI language from the dock and stay on the current page.

### Modified Capabilities
<!-- None: no existing spec covers locale selection. -->

## Impact

- `web/components/user-dock.tsx` — render the new switcher outside the `session ?` branch.
- `web/components/header/avatar-button.tsx` — drop the `Languages` submenu and its locale-change handler.
- New `web/components/language-switcher.tsx` (client component using `next-intl` `useRouter`/`usePathname`/`useLocale`).
- `web/messages/{en,br}.json` — reuse existing `Languages.*` keys; possibly add a tooltip label.
- No DB, server action, or judge changes.
