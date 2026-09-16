## Why

The profile page (`/user`) shows hardcoded placeholder numbers for contest and problem counts, and has no way for the owner to edit their bio, location, website, or username — the only edit UI that exists (`UpdateForm` in `_components/form.tsx`) is dead code, never rendered on the page.

## What Changes

- Replace hardcoded `"4"` / `"12"` contest/problem count fact rows with real counts derived from the user's actual contests and problems.
- Add an edit entry point (owner-only) on the profile page for username, bio, location, and website, backed by a form.
- Extend `updateProfile` server action and its Zod input schema to accept and persist `bio`, `location`, and `website` in addition to `username`.
- Wire the existing (currently unused) `UpdateForm` component into the profile page for the owner, or rebuild it to cover the new fields — replacing the current username-only form.

## Capabilities

### New Capabilities
- `profile-editing`: Owner-only editing of username, bio, location, and website from the profile page, persisted via server action.

### Modified Capabilities
- `profile-fetch-layout`: Contest count and problem count fact rows must reflect the profile user's real data, not a hardcoded placeholder value.

## Impact

- `web/app/[locale]/user/_components/profile.tsx` — replace hardcoded count values with real data.
- `web/app/[locale]/user/_components/form.tsx` — extend fields, wire into page.
- `web/app/[locale]/user/page.tsx` / `_components/tabs.tsx` — add edit entry point.
- `web/lib/actions/update-profile.ts` — accept bio/location/website.
- `web/hooks/user-update-profile.tsx` — extend `UpdateProfileInput` type.
- `web/lib/actions/get-profile.ts` (or a new action) — supply real contest/problem counts.
- `web/messages/*.json` — new i18n strings for edit fields.
