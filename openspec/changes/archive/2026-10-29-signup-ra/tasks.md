## 1. Schema and migration 0049

- [x] 1.1 Pre-flight on the dev DB: `SELECT lower(username), count(*) FROM "user" GROUP BY 1 HAVING count(*) > 1` returns no rows, and list the users whose `username ~ '^\d{7}$'` (the expected backfill set)
- [x] 1.2 `web/drizzle/schemas/users.ts`: remove `finishedOnboarding`, drop `.unique()` on `username`, add `uniqueIndex("user_username_lower_idx").on(sql\`lower(${t.username})\`)`, add `ra: text("ra").unique()`
- [x] 1.3 `bun db:generate --name signup_username_ra` → confirm the file is `0049_signup_username_ra.sql` with journal `idx: 49`, then reorder the SQL per design §7 (add column → backfill `UPDATE` with comment → add `user_ra_unique`)
- [x] 1.4 `bun db:migrate` on a copy of the dev DB (`judge_signup_ra`, set in `web/.env.local` — the shared `judge` DB still serves main), then verify: the column is gone, the index exists, the backfill rows match 1.1, and `INSERT`ing a case-variant username fails

## 2. Validation and identity helpers

- [x] 2.1 `web/lib/username.ts`: change the regex to `^[A-Za-z0-9.-]+$` with a case-neutral message, and add `raSchema` (trimmed, `^\d{7}$`) plus `optionalRaSchema` (`""` → `null`)
- [x] 2.2 New server-only `web/lib/identity.ts`: `isUsernameTaken(username, exceptUserId?)` using `lower()`, `isRaTaken(ra, exceptUserId?)`, and `identityConflictFromPgError(err)` that maps `23505` on `user_username_lower_idx`/`user_ra_unique` to `USERNAME_TAKEN`/`RA_TAKEN`
- [x] 2.3 Bun tests `web/lib/username.test.ts`: accepts `AnaSilva`, `0064019`, `a.b-c`; rejects `ana_silva`, `ab`, 21 characters; `raSchema` accepts `0064019` and rejects `64019`, `00640190`, `00a4019`; `optionalRaSchema` maps `""`/`"  "` to `null`

## 3. Better Auth config

- [x] 3.1 `web/lib/auth/index.ts`: remove `finishedOnboarding` from `additionalFields`, set `username` to `input: true`, add `ra` (`string`, not required, `input: true`)
- [x] 3.2 `databaseHooks.user.create.before`: if a username is given, validate it and check it is free; otherwise generate one. Validate and check `ra` when present, else `null`. Throw `APIError("BAD_REQUEST", { message: <CODE> })`
- [x] 3.3 Add a `hooks.before` middleware that rejects `/update-user` when the body has `username` or `ra`
- [x] 3.4 Manually test with curl or the auth client: sign up with a taken username in different case → `USERNAME_TAKEN`; `updateUser({ username })` → rejected

## 4. Remove onboarding

- [x] 4.1 New `web/lib/auth/require-user.ts` (`requireUser({ redirectTo })` → `getCurrentUser`)
- [x] 4.2 Replace every `requireOnboardedUser` import and call with `requireUser` (`grep -rn requireOnboardedUser web/app` must return nothing afterwards)
- [x] 4.3 Delete `web/lib/auth/require-onboarded-user.ts`, `web/app/[locale]/onboarding/`, `web/lib/actions/onboarding/`, `web/hooks/use-complete-onboarding.tsx`
- [x] 4.4 `social-auth-buttons.tsx`: drop `newUserCallbackURL`. Fix the `proxy.ts` comment. Update the URL regex in `docs/presentation/shoot_v4.py` to `/(home|problems)`
- [x] 4.5 Remove `OnboardingPage` from `web/messages/en.json` and `web/messages/br.json`, and grep for any remaining `onboarding` in `web/` (outside migrations)

## 5. Email signup form

- [x] 5.1 `sign-up-tab.tsx`: add `username` (required, `usernameSchema`) and `ra` (optional, `inputMode="numeric"`, `maxLength={7}`, help text) fields. Send both to `authClient.signUp.email`. Use `callbackURL: redirectTo` and push to `redirectTo` on success
- [x] 5.2 Map the `USERNAME_INVALID|USERNAME_TAKEN|RA_INVALID|RA_TAKEN` error codes to `form.setError` with translated messages. Fall back to the `failedSignUp` toast
- [x] 5.3 Non-blocking hint when the username is exactly 7 digits and RA is empty (design open question; drop it if rejected at review)
- [x] 5.4 Add `Auth.username`, `Auth.usernameDescription`, `Auth.ra`, `Auth.raDescription`, and the error keys to `en.json` and `br.json`

## 6. Profile editing and lookup

- [x] 6.1 `update-profile.ts` and `UpdateProfileInput`: accept `ra`, validate it with `optionalRaSchema`, use `isUsernameTaken`/`isRaTaken` excluding self, and map unique violations through `identityConflictFromPgError`
- [x] 6.2 `user/_components/form.tsx`: add the RA field (pre-filled, clearable) and update the username description text in both locales. Make sure the profile query that feeds the form includes the owner's own `ra` (own row only, never `publicUserColumns`)
- [x] 6.3 Make sure the update mutation invalidates every query showing username/RA (profile, class roster/gradebook keys) per the `mutation-cache-invalidation` skill
- [x] 6.4 `get-user-by-username.ts`: compare with `lower(username) = lower($1)`

## 7. RA for class owners

- [x] 7.1 `get-class.ts`: when `isOwner`, select `{ ...publicUserColumns, ra: true }` for memberships, otherwise keep it as is
- [x] 7.2 `class-detail.tsx` roster: show the RA (muted, monospace) next to the name when present
- [x] 7.3 `load-class-results-data.ts`: add `ra` to the student columns. Add `ra: string | null` to `GradebookStudent` and `ClassResultsStudent`
- [x] 7.4 `class-gradebook.tsx`: show the RA under the student name in the sticky column
- [x] 7.5 `gradebookToCsv` and `CLASS_RESULTS_HEADER`/`classResultsToCsv`: insert `ra` after `username` (`""` when null)
- [x] 7.6 Update `lib/gradebook.test.ts` and `lib/class-results.test.ts`: the header contains `ra`, `0064019` stays quoted as `"0064019"`, and a null RA gives an empty field

## 8. Verify

- [x] 8.1 `bun test lib`, `bun run lint`, `bunx tsc --noEmit` in `web/` all pass
- [x] 8.2 (via API on :3003 + DB copy; the form itself still needs a click-through, browser was signed in on a shared localhost cookie) In the browser on `DEV_PORT` (email login): sign up with `JoaoP` + RA `0064019` → land on `/home`; signing up again as `joaop` is rejected on the field; `/user/joaop` shows `JoaoP`
- [ ] 8.3 As the teacher test account: the class roster and gradebook show the RA; both CSVs have an `ra` column with leading zeros; as a student, the class data contains no RAs (check the network payload)
- [ ] 8.4 Profile form: change only the case of your own username → saved; set a duplicate RA → error; clear the RA → null
