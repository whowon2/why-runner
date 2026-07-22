## 1. Schema & migration

- [x] 1.1 Add `code text` (nullable) to `problem` in `web/drizzle/schemas/problems.ts` and a `problem_code_seq` Postgres sequence
- [x] 1.2 Add `username text` (nullable) and `finished_onboarding boolean not null default false` to `user` in `web/drizzle/schemas/users.ts`
- [x] 1.3 Generate the Drizzle migration for the above (add-nullable step)
- [x] 1.4 Write a data-backfill migration: assign base-36 `problem.code` (via the sequence) to all existing problems in creation order
- [x] 1.5 Write a data-backfill migration: assign a slugified-`name` + collision-suffix `user.username` to all existing users
- [x] 1.6 Generate and run the follow-up migration altering `problem.code` and `user.username` to `NOT NULL UNIQUE`
- [x] 1.7 Add a shared `generateProblemCode()` helper (base-36, digits `0-9A-Z`, reads `nextval('problem_code_seq')`) used by both problem creation and bulk import

## 2. Problem code generation & display

- [x] 2.1 Call `generateProblemCode()` in the "Create Problem" server action alongside slug generation, per `problem-lifecycle`
- [x] 2.2 Call `generateProblemCode()` in the bulk-import path so imported problems also get a `code`
- [x] 2.3 Update the problems-list query/component to select and render `code` and creator (name + link) per `problem-list-view`
- [x] 2.4 Update `web/app/[locale]/contests/_components/tabs/settings/problems.tsx` (`EditContestProblems`) picker items and the already-added list to show `[code] title` and creator per `contest-settings`
- [x] 2.5 Verify `code` is not present as an editable field anywhere in `web/app/[locale]/problems/_components/create.tsx`

## 3. Onboarding

- [x] 3.1 Add onboarding server action: validates and persists `username`, sets `finishedOnboarding = true`, rejects if `username` is taken
- [x] 3.2 Add `web/app/[locale]/onboarding/page.tsx` with a single-field username form calling the action from 3.1
- [x] 3.3 Add the onboarding gate at the authenticated layout/route boundary: if `finishedOnboarding === false` and the request isn't for `/onboarding`, redirect to `/onboarding`
- [x] 3.4 Update the profile edit form (`web/app/[locale]/user/_components/form.tsx`) "username" field to read/write the new `username` column instead of `name`

## 4. Profile routing by username

- [x] 4.1 Add `web/app/[locale]/user/[username]/page.tsx`: resolve user by `username`, 404/not-found if none exists
- [x] 4.2 Parameterize existing profile components (`profile.tsx`, `tabs.tsx`, `feed.tsx`, `my-problems.tsx`, `my-contests.tsx`) to accept a viewed-user distinct from the viewer, and derive an `isOwner` flag (`posts.tsx` left untouched — dead code, not imported anywhere)
- [x] 4.3 Gate avatar-upload, cover-upload, and profile-edit-form rendering behind `isOwner` per `profile-fetch-layout` MODIFIED requirements
- [x] 4.4 Confirm `web/app/[locale]/user/page.tsx` (self profile) still renders correctly for the signed-in user with `isOwner = true`
- [x] 4.5 Link problem/contest creator names (from task 2.3/2.4) to `/user/[username]`

## 5. Publish button placement

- [x] 5.1 Remove `PublishProblem` from the body of `ProblemEditTab` (`web/app/[locale]/problems/_components/workspace/edit.tsx`)
- [x] 5.2 Render `PublishProblem` in the problem workspace header/toolbar area in `web/app/[locale]/problems/_components/workspace/index.tsx`, visible only under the same `status === "draft"` condition as before
- [x] 5.3 Verify Save (end of form) and Publish (header) are no longer visually adjacent

## 6. Verification

- [ ] 6.1 Manually verify: creating a problem assigns a visible code; two same-titled problems are distinguishable in the problems list and contest picker
- [ ] 6.2 Manually verify: existing users can sign in without being stuck in an onboarding loop (backfilled username + `finishedOnboarding` respected)
- [ ] 6.3 Manually verify: new user sign-up is redirected to `/onboarding`, completes it, and lands in the app afterward
- [ ] 6.4 Manually verify: clicking a creator's name from the problems list and from the contest picker navigates to that creator's profile; non-owner viewers see no edit affordances
- [ ] 6.5 Manually verify: Save and Publish buttons are visually separated on the problem edit tab
