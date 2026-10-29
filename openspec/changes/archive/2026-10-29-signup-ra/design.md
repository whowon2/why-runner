## Context

Signup today has two steps. Better Auth creates the user, and its `databaseHooks.user.create.before` hook always fills `username` with `generateUsername(emailLocalPart)`. Email signup sends the user to `/onboarding`, and social login does the same through `newUserCallbackURL`. There the user picks a lowercase username, and `completeOnboarding` sets `finishedOnboarding = true`. Every signed-in page calls `requireOnboardedUser`, which reads the flag straight from the DB (the session cookie cache can be up to 5 minutes stale) and redirects to `/onboarding`.

`usernameSchema` (`^[a-z0-9.-]+$`, 3–20) is shared by onboarding, the profile edit form and `updateProfile`. The `user.username` column has a plain `UNIQUE` constraint, and duplicate checks compare with `eq`. Class owners see students through `getClass` (roster, `publicUserColumns`) and `loadClassResultsData`, which feeds the gradebook page, `gradebookToCsv` and `classResultsToCsv`. The latter two are pure functions with Bun tests.

The test class on 2026-10-29 put their RA (7-digit IFMG student ID, e.g. `0064019`) in the username field, so the DB already has usernames that are RAs.

## Goals / Non-Goals

**Goals:**
- One-step signup: email signup collects name, username, email, password and an optional RA, and social login needs no extra step.
- Usernames keep the case the user typed, and uniqueness ignores case (`Ana` and `ana` cannot both exist).
- RA is stored losslessly as text, is unique, is optional, and only the user and their class owners can see it.
- The existing RA-in-username accounts get their `ra` filled in by the migration.

**Non-Goals:**
- No RA in contest exports, leaderboards, public profiles, the command palette or search.
- No check of RAs against an IFMG registry. Format only.
- No forced username change for social-login users and no "complete your profile" nag.
- No canonical-case redirect for `/user/[username]`: `/user/ana` renders `Ana`'s profile without redirecting.
- No changes to the judge.

## Decisions

### 1. `requireUser` replaces `requireOnboardedUser`
New `lib/auth/require-user.ts` exports `requireUser({ redirectTo })`, which just calls `getCurrentUser`. It is kept as a separate name so page guards read the same everywhere and can gain checks later. All call sites keep `redirectTo: "/auth/signin"`. The DB read for the flag goes away, so there is one fewer query per page load.
*Alternative:* call `getCurrentUser` directly at each call site. Rejected because the user asked for a require-user helper, and a single guard name is easier to grep.

### 2. Username and RA enter through Better Auth's signup, validated in the create hook
`additionalFields.username` becomes `{ type: "string", required: false, input: true }`, and a new `ra: { type: "string", required: false, input: true }` is added. `finishedOnboarding` is removed. `databaseHooks.user.create.before` then works like this:
- If `user.username` is present (email signup), parse it with `usernameSchema` and check that no `lower(username)` matches.
- If it is absent (social login), use `generateUsername(...)` as today.
- If `ra` is present, trim it, store `""` as `null`, otherwise parse it with `raSchema` and check uniqueness.
- On failure, throw `APIError("BAD_REQUEST", { message: CODE })` with a stable code (`USERNAME_INVALID`, `USERNAME_TAKEN`, `RA_INVALID`, `RA_TAKEN`). The signup tab maps each code to `form.setError` on the matching field with a translated message. Unknown errors fall back to the existing `failedSignUp` toast.

The checks live in one server-only module (`lib/identity.ts`: `isUsernameTaken(username, exceptUserId?)`, `isRaTaken(ra, exceptUserId?)`), shared with `updateProfile`.
*Alternative:* a separate `checkAvailability` server action called before `signUp.email`. Rejected because it adds a race window and a second round trip, and the hook has to enforce the rules anyway.

### 3. Block `username`/`ra` on Better Auth's `/update-user`
`input: true` also lets `authClient.updateUser({ username })` write the field without our validation. A `hooks.before` middleware (`createAuthMiddleware`, available in better-auth 1.4.7) rejects `/update-user` requests whose body contains `username` or `ra`. The app never calls `updateUser`; `updateProfile` writes through Drizzle and does its own checks.
*Alternative:* validate in `databaseHooks.user.update.before`. Rejected because that hook also fires for internal updates and does not reliably expose the target user id, which the "except self" uniqueness check needs.

### 4. Case-insensitive uniqueness through a `lower(username)` unique index
The Drizzle schema drops `.unique()` on `username` and adds `uniqueIndex("user_username_lower_idx").on(sql\`lower(${t.username})\`)`. Lookups and duplicate checks use ``sql`lower(${user.username}) = lower(${value})` ``, which the same index serves. The plain constraint is redundant once the lower index exists, so it is dropped. If two concurrent requests race past the pre-check, the index rejects one of them. In `updateProfile`, the resulting Postgres `23505` error is mapped to `USERNAME_TAKEN`/`RA_TAKEN` by constraint name. On signup the insert happens inside Better Auth, so the loser of that race gets the generic sign-up failure.
*Alternative:* a `citext` column. Rejected because it needs an extension, changes the column type the auth adapter sees, and the user asked for a `lower()` index.

`usernameSchema` becomes `^[A-Za-z0-9.-]+$` with the same 3–20 length, and its message no longer says "lowercase". `generateUsername` keeps producing lowercase names (unchanged).

### 5. RA: `text`, nullable, `UNIQUE`, exactly `^\d{7}$`
`ra: text("ra").unique()`. Postgres allows many NULLs under a unique constraint, which is what "optional" needs. `raSchema = z.string().trim().regex(/^\d{7}$/)`. Empty input becomes `null` (it clears the RA in the profile form). The column is `text` so `0064019` keeps its leading zeros. The UI uses `inputMode="numeric"` with `maxLength={7}`, never `type="number"`.

### 6. Who sees RA
`ra` is **not** added to `publicUserColumns`. It is read in three places only:
- the user's own profile form defaults, read from the user's own row,
- `getClass`, which selects `{ ...publicUserColumns, ra: true }` only when `isOwner` (non-owners already get `members: []`),
- `loadClassResultsData`, which is owner-only through `assertClassOwner` in both callers.

The session object also carries `ra` once it becomes an additional field. That is the user's own data, so this is fine.

`GradebookStudent` and `ClassResultsStudent` gain `ra: string | null`. Both CSVs add an `ra` column right after `username`, empty when null. The existing quoting already keeps `0064019` as a string. Spreadsheets may still drop the leading zeros on import; see Risks. On screen, the roster shows the RA in muted monospace next to the name, and the gradebook's sticky student cell shows it under the name.

### 7. Migration 0049, hand-ordered
Generate with `bun db:generate --name signup_username_ra`, then edit the SQL so the backfill runs between adding the column and adding its constraint:

```sql
ALTER TABLE "user" DROP COLUMN "finished_onboarding";
ALTER TABLE "user" DROP CONSTRAINT "user_username_unique";
CREATE UNIQUE INDEX "user_username_lower_idx" ON "user" (lower("username"));
ALTER TABLE "user" ADD COLUMN "ra" text;
-- Classroom test 2026-10-29: students typed their RA as username.
UPDATE "user" SET "ra" = "username" WHERE "username" ~ '^\d{7}$' AND "ra" IS NULL;
ALTER TABLE "user" ADD CONSTRAINT "user_ra_unique" UNIQUE ("ra");
```

The backfill cannot collide: usernames are already unique and `ra` starts empty. The index build fails if two existing usernames differ only by case. The current regex and `generateUsername` only produce lowercase, so this should not happen, but task 1.1 checks the dev DB first.

### 8. Redirects after signup
Email signup uses `callbackURL: redirectTo` and `router.push(redirectTo)`. Social login drops `newUserCallbackURL`. `redirectTo` already defaults to `/home` (`safeRedirectPath`), so the user-home rule "land on `/home` without explicit redirectTo" still holds.

## Risks / Trade-offs

- [Parallel migrations 0050/0051 on other branches] → This branch claims `0049` and journal `idx: 49`. The other two branches regenerate or renumber after this merges first. Their snapshots must be rebuilt on top of `0049_snapshot.json`, not hand-merged.
- [Excel/LibreOffice turns `0064019` into `64019` on CSV import] → The field is quoted text in the file, which is correct. The column header stays `ra`. A note in the export UI is out of scope. Teachers can import the column as Text.
- [Existing sessions still hold `finishedOnboarding` in the cookie cache for ≤5 min after deploy] → Harmless, because nothing reads it any more.
- [Users who already picked a lowercase username keep it] → That is the intended behaviour. They can change the case in the profile form, and the uniqueness check excludes their own row, so `ana → Ana` is allowed.
- [RA uniqueness lets one student "claim" another's RA] → A collision shows `RA_TAKEN`. The real owner of the RA asks the teacher, who can fix it in the DB. Admin tooling is out of scope.
- [Students may still type their RA as the username] → Allowed (7 digits is a valid username). The RA field next to it, with help text, should reduce this. See the open question.

## Migration Plan

1. Merge this branch first. Production runs `scripts/migrate-if-production.mjs` on build, which applies `0049`.
2. Rollback: revert the commit and run a reverse migration (`ADD COLUMN finished_onboarding boolean DEFAULT true NOT NULL`, drop `ra`, drop the lower index, re-add `user_username_unique`). The rollback default is `true` so nobody gets sent back to onboarding. Mixed-case usernames created in the meantime would still need manual handling before the plain constraint makes sense again.

## Open Questions

- Should signup warn (not block) when the username is exactly 7 digits and the RA field is empty ("Is this your RA? Put it in the RA field")? Proposed default: yes, as a non-blocking field hint. Cheap, and it targets exactly the failure from the classroom test.
