## Context

`web/app/[locale]/user/_components/profile.tsx` renders two fact rows with literal strings `"4"` and `"12"` for contest/problem counts — never wired to real data. `web/app/[locale]/user/_components/form.tsx` (`UpdateForm`) already exists and edits `username` via `updateProfile`, but is not imported/rendered anywhere (`page.tsx` only renders `Profile` + `ProfileTabs`). `bio`, `location`, `website` already exist as nullable text columns on `user` (`drizzle/schemas/users.ts`) and are already read by `getProfile`/displayed by `Profile`, but nothing writes them.

## Goals / Non-Goals

**Goals:**
- Real contest/problem counts on the profile card.
- Owner can edit username, bio, location, website from the profile page.

**Non-Goals:**
- Redesigning the fact-row layout itself (`profile-fetch-layout` visual spec stands).
- Editing avatar/cover image handling (already covered by `profile-media`, unchanged).
- Public-facing edit for non-owners (still owner-only, same as existing avatar/cover controls).

## Decisions

- **Counts source**: compute `contestCount`/`problemCount` server-side in `getProfile` (single round trip) via `count()` aggregates against `userOnContest`/`problem` filtered by the profile's `userId`, rather than a client-side second fetch — avoids extra waterfall and matches existing single-`useProfile`-call shape. Alternative considered: reuse `my-contests`/`my-problems` list queries and take `.length` — rejected because those are paginated and would undercount.
- **Edit entry point**: an owner-only "Edit profile" trigger opens `UpdateForm` in a `Dialog` rather than an inline always-visible form, keeping the read-mostly card layout (`profile-fetch-layout`) unchanged for visitors and reducing owner-view clutter. Alternative considered: inline editable fields (click-to-edit each fact row) — rejected as larger surface area for this fix.
- **Form scope**: extend the existing `UpdateForm`/`updateProfileSchema`/`UpdateProfileInput` rather than writing a new component, since it already has the RHF+Zod+mutation wiring for `username`; add `bio`/`location`/`website` as optional string fields to the same schema and to `updateProfile`'s persisted `.set()`.
- **Validation**: `bio` capped at a reasonable length (e.g. 280 chars) and `website` validated as a URL (or empty) in the Zod schema, mirroring the `usernameSchema` pattern already used server-side.

## Risks / Trade-offs

- [Extra JOIN/subquery cost per profile view] → counts are on indexed FK columns (`userOnContest.userId`, `problem.userId`), negligible at current scale.
- [Dialog-based edit could feel disconnected from the fields it edits] → dialog is opened from the profile card itself (not a separate settings page), keeping context.
- [Existing `form.tsx` may have i18n keys (`UserForm.*`) that don't cover new fields] → add missing keys to `web/messages/*.json` for both locales.
