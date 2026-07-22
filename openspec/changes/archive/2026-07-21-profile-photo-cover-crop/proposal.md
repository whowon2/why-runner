## Why

Profile editing today only accepts a raw image URL for the avatar and has no cover/banner image at all — users cannot upload their own photo, and there is no visual editing step. This adds file-based avatar and cover upload with an interactive crop/zoom dialog, matching the target UX (circular avatar crop, wide-aspect cover crop, zoom slider, cancel/confirm).

## What Changes

- Add file upload (not URL paste) for profile avatar, replacing the current `image` text-input field in the profile edit form.
- Add a new profile **cover/banner image** capability: upload, display behind the avatar on the settings page, replacing the current static gradient placeholder.
- Add a reusable crop dialog ("Ajustar avatar" / "Ajustar capa") with drag-to-reposition, zoom slider, grid overlay, Cancelar/Confirmar actions — built with a client-side cropping library (e.g. `react-easy-crop`).
- Avatar crop is fixed 1:1 (circular mask); cover crop is a fixed wide aspect ratio (e.g. 3:1 or 4:1) matching the banner display area.
- Add server-side image storage: a new server action receives the cropped image blob, resizes/re-encodes it (`sharp`), and persists it to local disk under `public/uploads/{avatars,covers}/`, storing the resulting relative URL.
- **BREAKING**: `image` field in the profile edit form (`form.tsx`) changes from a URL text input to a file-upload trigger; direct URL pasting is removed from the UI (server-side column is unchanged, still stores a URL string).
- Add `coverImage` column to `user` table (Drizzle schema + migration), mirrored in Better Auth's generated schema file if required for type consistency.

## Capabilities

### New Capabilities
- `profile-media`: Uploading, cropping, storing, and displaying a user's avatar and cover images.

### Modified Capabilities
(none — no existing spec covers profile editing today)

## Impact

- `web/drizzle/schemas/users.ts` — add `coverImage` column; new migration via `bun db:generate`.
- `web/drizzle/schemas/auth-schema.ts` — sync generated schema if Better Auth requires the new column there too.
- `web/app/[locale]/user/_components/form.tsx` — replace avatar URL input with upload trigger + crop dialog; add cover upload trigger + crop dialog.
- `web/app/[locale]/user/_components/profile.tsx` — render real cover image instead of gradient placeholder.
- `web/lib/actions/update-profile.ts` — extend or add server action(s) to accept uploaded/cropped image blobs, process, and persist file + URL.
- New component: crop dialog (shared between avatar and cover, parameterized by aspect ratio/shape).
- `web/package.json` — new dependencies: `react-easy-crop` (client crop UI), `sharp` (server-side resize/encode).
- `public/uploads/` — new static file storage location (avatars + covers), served directly by Next.js.
- `web/messages/*.json` (pt, en) — new i18n strings ("Ajustar avatar", "Ajustar capa", "Alterar capa", "Confirmar", "Cancelar", etc.).
