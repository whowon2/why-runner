## 1. Schema

- [x] 1.1 Add `joinedAt: timestamp("joined_at").defaultNow()` (nullable) to `userOnContest` in `web/drizzle/schemas/users.ts`
- [x] 1.2 Check sibling worktrees' `web/drizzle/migrations/` for numbering collisions, then `bun db:generate` (`0047_colorful_alice.sql`, hand-edited to add the column without a default first so existing rows stay NULL, then `SET DEFAULT now()`) and `bun db:migrate`
- [x] 1.3 Verify `joinContest` / `approveJoin` inserts don't bypass the column default

## 2. Home data action

- [x] 2.1 Create `web/lib/actions/home/get-home-data.ts` (`"use server"`, `requireOnboardedUser`/`getCurrentUser` session-only, no user-id arg) returning all widget data via `Promise.all`
- [x] 2.2 Pending lessons: joined (non-owned) classes → published lessons without a `lesson_submission` for the user; passed/total exercise progress scoped by `exerciseId`; order `due_date ASC NULLS LAST`, limit 5; include `isOverdue`
- [x] 2.3 Running contests: accepted participation, `status = published`, `start_date <= now() < end_date` (DB `now()`)
- [x] 2.4 Last joined contest: order `COALESCE(joined_at, start_date, created_at) DESC`, excluding running ids, limit 1, with derived status (upcoming/running/finished)
- [x] 2.5 Recent solves: distinct `problem_id` with `PASSED` submission, ordered by latest pass, limit 5, joined to problem title/code/slug/difficulty
- [x] 2.6 Suggested problems: published, not authored by user, not solved; rank by tag overlap with solved problems, then difficulty distance from user's median, then `md5(id || current_date)`; easiest-first for users with no solves; limit 3
- [x] 2.7 Suggested contests: published, public, not ended, not joined; order `start_date ASC`, limit 3
- [x] 2.8 Ensure any user columns returned use `publicUserColumns` (no `email`)
- [x] 2.9 Add `web/hooks/use-home-data.tsx` (`useQuery`, key `["home"]`)

## 3. Home page UI

- [x] 3.1 Create `web/app/[locale]/home/page.tsx` (server component, `requireOnboardedUser({ redirectTo: "/auth/signin" })`, shared `PageHeader` per `creating-a-page` skill)
- [x] 3.2 `_components/home-dashboard.tsx`: client grid (2 cols `md+`, stacked mobile) with loading skeletons
- [x] 3.3 `_components/pending-lessons-card.tsx`: title, class, due date, progress, overdue badge, link to lesson; empty state → `/classes`
- [x] 3.4 `_components/running-contest-card.tsx`: name, live countdown to end, link; omitted when empty
- [x] 3.5 `_components/last-contest-card.tsx`: name, status badge, link; empty state → `/contests`
- [x] 3.6 `_components/recent-solves-card.tsx`: title, code, difficulty, link; empty state → `/problems`
- [x] 3.7 `_components/suggestions-card.tsx`: problems + contests sections, each with link; graceful when both lists empty
- [x] 3.8 Add `Home.*` i18n keys to `web/messages/en.json` and `web/messages/br.json` (titles, empty states, overdue, status labels, countdown)

## 4. Landing page

- [x] 4.1 In `web/app/[locale]/page.tsx`, remove the Contests/Problems hero buttons
- [x] 4.2 Add single CTA via `authClient.useSession()`: "Get started" → `/auth/signin` (default while loading), "Go to home" → `/home` when signed in
- [x] 4.3 Replace `HomePage.buttons.*` with `HomePage.cta.getStarted` / `HomePage.cta.goHome` in both locales; grep for leftover `buttons.contests`/`buttons.problems` usages

## 5. Navigation & redirects

- [x] 5.1 `web/components/user-dock.tsx`: Home href = `/home` with session, `/` otherwise; active state works for `/home`
- [x] 5.2 `web/components/command-palette/commands.ts`: "Go home" pushes `/home` when signed in, `/` otherwise
- [x] 5.3 `web/lib/auth/redirect-path.ts`: `safeRedirectPath` fallback `"/"` → `"/home"`; confirm sign-in, sign-up/onboarding, and social auth flows land on `/home` without explicit `redirectTo`, and anonymous `getCurrentUser` fallback still goes to `/`

## 6. Cache invalidation

- [x] 6.1 Per `mutation-cache-invalidation` skill, add `["home"]` invalidation to join/leave contest, join/leave class, submit lesson; `useHomeData` uses `staleTime: 0` instead of invalidating on submission create, since the judge's PASSED verdict lands asynchronously

## 7. Verify

- [x] 7.1 `bun run build` + `tsc` pass in `web/`; `bun lint` only reports pre-existing errors in untouched files
- [x] 7.2 Manual: anonymous `/` shows "Get started", no Contests/Problems buttons; `/home` redirects to sign-in with `redirectTo=%2Fhome`
- [x] 7.3 Manual: student with pending lesson, running contest, solves sees each widget populated; brand-new user sees empty states + suggestions (checked logged in via Chrome on :3002 — last contest, recent solves, suggestions, pending empty state; running-contest widget and pending rows verified only at the data layer, no live contest/pending lesson for that account)
- [ ] 7.4 Manual: solve a problem → it leaves suggestions and appears in recent solves after returning to `/home`
- [x] 7.5 Update `openspec/specs/landing-page` purpose line if needed when archiving (still accurate, no change)
