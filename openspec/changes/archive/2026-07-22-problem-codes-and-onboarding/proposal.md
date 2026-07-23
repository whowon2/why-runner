## Why

Problems can share a title (e.g. two "Two Sum" problems), and the contest problem picker (`web/app/[locale]/contests/_components/tabs/settings/problems.tsx`) lists problems by title alone, so creators can't tell them apart or know who authored each one before adding it to a contest. Separately, there's no way to view another user's profile — the only profile route always shows the signed-in user, and there's no `username` field to link to or route by, and no onboarding step to collect one. Finally, on the problem edit workspace, Save and Publish sit stacked directly on top of each other (`web/app/[locale]/problems/_components/workspace/edit.tsx`), inviting an accidental publish right after a save.

## What Changes

- Add a short, unique, human-readable `code` to every problem (auto-generated on creation, e.g. `0`, `1`, ... `9`, `A`, ... `Z`, `10`, ... growing in length as needed), shown in the problems list and the contest problem picker so same-named problems are distinguishable.
- Show each problem's creator (name) in the contest problem picker and problem list; the creator name is a link.
- Add a `username` column to `user` (unique, separate from display `name`) and a `finishedOnboarding` boolean, defaulting to `false`.
- Add an onboarding page shown to authenticated users who have not finished onboarding, where they set their `username`; completing it sets `finishedOnboarding = true`.
- Add a public profile route addressed by `username` (e.g. `/user/[username]`) so clicking a creator's name navigates to their profile; the existing self-profile page continues to work for the signed-in user's own view.
- Reposition the Publish button in the problem edit workspace away from Save (e.g. into a distinct header/toolbar area) so the two actions are not adjacent.

## Capabilities

### New Capabilities
- `problem-codes`: generation, uniqueness, and display of short alphanumeric problem codes.
- `user-onboarding`: `username` + `finishedOnboarding` fields and the onboarding page/redirect flow.
- `user-profile-routing`: public, username-addressed profile route distinct from the self-profile page.

### Modified Capabilities
- `problem-list-view`: list rows also show each problem's code and creator (linked to their profile).
- `contest-settings`: the contest problem picker (Problems tab) shows each candidate problem's code and creator, not just its title, so same-named problems are distinguishable when adding them to a contest.
- `problem-lifecycle`: problem creation additionally assigns a unique `code` at row-creation time, alongside the existing generated slug.
- `profile-fetch-layout`: the info-card layout is reused for any user addressed by `username` (not just the signed-in user), with viewer-specific affordances (e.g. edit controls) restricted to the profile owner.

## Impact

- **Schema**: `web/drizzle/schemas/problems.ts` (new `code` column, unique, not null), `web/drizzle/schemas/users.ts` (new `username` column, unique, and `finishedOnboarding` boolean) — requires a Drizzle migration; `judge/` is unaffected (no shared enum changes).
- **Contest problem picker**: `web/app/[locale]/contests/_components/tabs/settings/problems.tsx` — item rendering and possibly search/filter.
- **Problem list**: `web/app/[locale]/problems/_components/*` list/table rendering.
- **Problem edit workspace**: `web/app/[locale]/problems/_components/workspace/edit.tsx`, `publish-button.tsx`, `create.tsx` — button layout only, no behavior change to save/publish logic.
- **User profile**: `web/app/[locale]/user/page.tsx` (self-profile, unchanged behavior) plus a new dynamic route for `/user/[username]`; profile components in `web/app/[locale]/user/_components/` reused/parameterized by viewed user.
- **New onboarding route and redirect/middleware logic** gating access for users with `finishedOnboarding = false`.
- **Auth/session**: wherever the current user is loaded post sign-in, may need to check `finishedOnboarding` to redirect appropriately.
