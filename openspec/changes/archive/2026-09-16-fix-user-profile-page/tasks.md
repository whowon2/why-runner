## 1. Backend: real counts + extended profile update

- [x] 1.1 Extend `getProfile` (`web/lib/actions/get-profile.ts`) to also return `contestCount` and `problemCount`, computed via `count()` against `userOnContest`/`problem` filtered by `userId`.
- [x] 1.2 Update `useProfile` hook return type to include `contestCount`/`problemCount`.
- [x] 1.3 Extend `updateProfileSchema`/`UpdateProfileInput` (`web/hooks/user-update-profile.tsx`) with optional `bio` (max 280 chars), `location`, and `website` (valid URL or empty).
- [x] 1.4 Extend `updateProfile` server action (`web/lib/actions/update-profile.ts`) to validate and persist `bio`, `location`, `website` alongside `username` in the same `.set()`/`.where()` call.

## 2. Frontend: fix hardcoded counts

- [x] 2.1 Replace the hardcoded `"4"`/`"12"` values in `web/app/[locale]/user/_components/profile.tsx` `FactRow` calls with `data.contestCount`/`data.problemCount`.

## 3. Frontend: edit entry point and form

- [x] 3.1 Extend `UpdateForm` (`web/app/[locale]/user/_components/form.tsx`) with `bio`, `location`, `website` fields (Textarea for bio, Input for location/website), wired to the extended schema/mutation.
- [x] 3.2 Wrap `UpdateForm` in a `Dialog` triggered by an "Edit profile" button, rendered only when `isOwner` is true (in `profile.tsx` or a new small wrapper component alongside it).
- [x] 3.3 On successful save, invalidate the `["profile", userId]` query so the profile card re-renders with new values without a full reload.

## 4. i18n

- [x] 4.1 Add missing `UserForm.*` keys (bio/location/website labels, placeholders, descriptions) and any new "Edit profile" trigger copy to `web/messages/en.json` and `web/messages/pt.json` (repo has no `pt.json`; used the actual `br.json` locale file instead).

## 5. Verification

- [x] 5.1 `bun lint` in `web/` — no new errors from touched files (repo has pre-existing unrelated lint errors in other files).
- [ ] 5.2 Manually verify in dev: owner sees edit control, non-owner does not; editing bio/location/website/username persists and reflects immediately; duplicate username and invalid website are rejected with visible errors; contest/problem counts match actual DB state for a seeded user.
