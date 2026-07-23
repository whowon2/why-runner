## Context

Three previously-unrelated gaps, bundled because they touch the same edit/selection surfaces:

1. Problems have no distinguishing identifier besides `title` (which is not unique) and an opaque `slug`/`uuid`. The contest problem picker (`web/app/[locale]/contests/_components/tabs/settings/problems.tsx`) renders a `<Select>` of bare titles, sourced from `useProblems()`.
2. `user` (`web/drizzle/schemas/users.ts`) has no `username` column — the profile edit form labels the `name` field "username" in copy only — and no onboarding flag. There is exactly one profile route, `web/app/[locale]/user/page.tsx`, which always resolves to the signed-in user; there is no route to view someone else's profile.
3. `ProblemEditTab` (`web/app/[locale]/problems/_components/workspace/edit.tsx`) stacks the Save button (end of `NewProblem`'s form) directly above the Publish button (`PublishProblem`), separated only by a thin `border-t`.

Stack: Next.js 16 (App Router, `app/[locale]/...`), Drizzle/Postgres, server actions. No `judge/` involvement — this is `web/`-only.

## Goals / Non-Goals

**Goals:**
- Every problem gets a short, unique, stable `code` at creation time, displayed anywhere a problem is listed for selection.
- Contest problem picker and problems list show creator + code so identically-titled problems are distinguishable.
- Users get a real `username` (distinct from `name`), collected via a mandatory onboarding step for users who haven't set one.
- Clicking a creator's name navigates to that creator's public profile at a username-addressed route.
- Save and Publish are no longer visually adjacent on the problem edit tab.

**Non-Goals:**
- No change to problem/contest visibility rules, publish validation logic, or grading.
- No reuse of `code` as the primary key or URL slug — `id`/`slug` keep their existing roles; `code` is purely a short display/disambiguation identifier.
- No general user-search/directory feature — profile routing by username is only for the "click creator name" flow.
- No enforcement of username format policy beyond uniqueness + basic charset (no elaborate reserved-word list, moderation, etc.).

## Decisions

### Problem code: sequential base-36 counter, generated server-side at row creation
Store `code text not null unique` on `problem`. Generate it the same place `slug` is generated today (problem creation server action), from a Postgres sequence (`problem_code_seq`) converted to base-36 using digits `0-9A-Z`, uppercase, no padding: `0, 1, ..., 9, A, ..., Z, 10, 11, ..., ZZ, 100, ...`. This is monotonic, collision-free without a retry loop, and short (2 chars covers 1296 problems, 3 chars covers 46656).

Why a DB sequence over `nextval`-less alternatives:
- **Random short code (nanoid-style) + retry-on-conflict**: rejected — adds retry logic and unique-constraint races for no benefit; sequence is simpler and the code is meant to be a stable, low-cardinality label, not an opaque public ID (that's already `slug`/`id`).
- **Zero-padded fixed-width (`000`, `001`, ...)**: rejected — the proposal's own example (`0`, `1`, ... `Z00`) is a growing-width scheme; fixed-width either wastes space early or needs a width bump later. Variable-width base-36 matches the requested format and needs no future migration.
- Display format in UI: `[CODE] Title`, e.g. `[3F] Two Sum`.

### `username` is a new column, independent of `name`
Add `username text not null unique` to `user`, backfilled for existing rows via migration (see Migration Plan), separate from the existing `name` (display name, not unique). The profile edit form's "username" label was already lying about which field it edits — this decision makes the label true by pointing it at the real column, and `name` keeps being the free-text display name shown in fastfetch-style headers etc.

Alternative considered: repurpose `name` as the unique username. Rejected — `name` is already used as a free-text display name (unicode, spaces, changeable) across existing profile UI (`profile-fetch-layout` header line); forcing it unique/slug-safe would be a breaking behavior change to that spec.

### Onboarding gating via a check in the authenticated layout, not middleware
`finishedOnboarding boolean not null default false` on `user`. Gate at the root authenticated layout (wherever `getCurrentUser()` is already called for auth pages) rather than Next.js middleware: the codebase's existing auth pattern is server-action/server-component `getCurrentUser({ redirectTo })` calls (see `user/page.tsx`), not edge middleware, so this stays consistent with the existing pattern and avoids adding a new cross-cutting middleware file for a single flag check.

- Any authenticated request where `finishedOnboarding === false` and the request isn't already for the onboarding page itself redirects to `/onboarding`.
- Onboarding page: single field (`username`), submits a server action that sets `username` and `finishedOnboarding = true`.
- Users created before this change get `finishedOnboarding = false` by default (column default) and a generated placeholder-unique `username` from migration backfill, so they're routed through onboarding once to pick their real one — see Migration Plan.

### Profile routing: new `/[locale]/user/[username]` route, self page unchanged
Add `web/app/[locale]/user/[username]/page.tsx` that resolves a user by `username` and renders the same profile components (`profile.tsx`, `tabs.tsx`, etc.) already used by `web/app/[locale]/user/page.tsx`, parameterized by viewed-user vs. viewer identity so owner-only affordances (avatar/cover upload, edit form) only render when the viewer is the profile owner. `web/app/[locale]/user/page.tsx` keeps resolving "self" (e.g. by continuing to look up the signed-in user directly, or by redirecting to `/user/[own-username]` — implementation detail for tasks.md) so existing self-profile links/behavior don't break.

Alternative considered: fold everything into one `/[locale]/user/[username]/` route and have the self-profile links redirect there. Rejected for this change — larger surface change than needed; keeping `user/page.tsx` as-is minimizes risk to the already-shipped `profile-fetch-layout`/`profile-media` specs, while the new `[username]` route is additive.

### Button separation: move Publish into the workspace header/toolbar
Move `PublishProblem` out of `ProblemEditTab`'s body (currently right below the form) into the problem workspace's header area (`web/app/[locale]/problems/_components/workspace/index.tsx`), alongside the tab bar or page title, so it's spatially distant from the Save button at the bottom of the form. Save stays a normal end-of-form submit button.

Alternative considered: keep both in the body but add more vertical spacing/a distinct visual container. Rejected — proposal explicitly asks to move it "far from" Save, and header placement also makes Publish reachable without scrolling through the full form, which is a genuine usability improvement, not just spacing.

## Risks / Trade-offs

- **[Risk]** Backfilling `username` for existing users needs a deterministic, unique value with no user input available at migration time. → **Mitigation**: seed from existing `name` (slugified) with a numeric suffix on collision (`ada`, `ada-2`, ...); these users still get `finishedOnboarding = false` so they're prompted once to pick a real username, and the seeded value is just a safe unique placeholder.
- **[Risk]** Adding a NOT NULL `username` and `code` column to existing tables requires backfill-before-constraint in the migration (can't add `NOT NULL UNIQUE` in the same step as populating existing rows). → **Mitigation**: standard 3-step migration (add nullable → backfill → alter to NOT NULL/UNIQUE), documented in Migration Plan.
- **[Risk]** Onboarding gate applied too broadly could lock out API/server-action calls that aren't page navigations. → **Mitigation**: gate only in the page-rendering layout/route boundary, not in shared server actions used by both onboarded and non-onboarded contexts.
- **[Trade-off]** Base-36 sequence codes reveal creation order and approximate total problem count. Judged acceptable — `id` (uuid) and `slug` already exist as non-sequential identifiers for cases where that leak matters; `code` is explicitly a short display label, not a security-sensitive ID.

## Migration Plan

1. Add `problem.code` (nullable), `user.username` (nullable), `user.finished_onboarding boolean not null default false`.
2. Backfill: assign `problem.code` via the base-36 sequence for all existing rows in creation order; assign `user.username` via slugified-`name` + collision suffix for all existing rows.
3. Alter `problem.code` to `NOT NULL UNIQUE`, `user.username` to `NOT NULL UNIQUE`.
4. Ship the onboarding gate and new route together with step 3 (not before) so no request can hit a null `username`.
5. Rollback: drop the two new columns and the gate/route code; `finished_onboarding` and `code` have no other readers, so this is a clean revert if needed pre-release.

## Open Questions

- Exact `username` charset/length rules (e.g. `[a-z0-9-]{3,20}`) — left to tasks.md/implementation, not spec-relevant beyond "unique."
- Whether `/user/page.tsx` (self) should eventually redirect to `/user/[username]` for URL consistency — deferred, out of scope per Non-Goals.
