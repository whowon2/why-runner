## Why

`/` currently serves two audiences at once: it is the marketing landing page, and its hero buttons ("Contests", "Problems") are also the de-facto entry point for signed-in users. A returning student or professor gets no view of their own activity — they have to dig through `/classes`, `/contests` and `/problems` to find a pending assignment or the contest they are in. A personal home page gives them that at a glance, and lets the landing page be purely a pitch.

## What Changes

- **Landing page (`/`)**: remove the hero "Contests" / "Problems" buttons. Replace them with a single auth-aware call to action: "Get started" (→ `/auth/signin`) for anonymous visitors, "Go to home" (→ `/home`) for signed-in users. The rest of the landing (previews, features, how-it-works, stack) stays.
- **New home page (`/home`)**: authenticated + onboarded only (redirects to sign-in otherwise). Shows widgets for the current user:
  - **Pending class exercises** — published lessons in classes they joined that they have not submitted yet, soonest due date first (overdue flagged).
  - **Running contest** — accepted contests they participate in that are live now (`startDate ≤ now < endDate`).
  - **Last joined contest** — most recently joined contest (any state).
  - **Recently solved problems** — last distinct problems with a `PASSED` submission.
  - **Suggestions** — published problems they have not solved, and public published contests (upcoming or running) they have not joined.
  - Each widget has a friendly empty state with a link to the matching section.
- **Navigation**: dock "Home" icon and the command palette "Go home" command point to `/home` for signed-in users (`/` for anonymous). Default post-sign-in / post-onboarding destination becomes `/home` when no explicit `redirectTo` is set.
- **Schema**: add `user_on_contest.joined_at` (timestamp, default `now()`, nullable for existing rows) so "last joined contest" can be ordered. New migration.
- New i18n keys (`en`, `br`) for the home page; remove the unused `HomePage.buttons.*` keys.

## Capabilities

### New Capabilities
- `user-home`: the authenticated `/home` dashboard — which widgets exist, what data each shows, ordering/limits, empty states, and access rules.

### Modified Capabilities
- `landing-page`: hero no longer links to contests/problems; adds the auth-aware single CTA requirement.

## Impact

- `web/app/[locale]/page.tsx` (hero CTA), new `web/app/[locale]/home/` page + `_components/`.
- New server action(s) under `web/lib/actions/home/` + React Query hook(s) in `web/hooks/`.
- `web/drizzle/schemas/users.ts` (`userOnContest.joinedAt`) + migration `0047_*`; `joinContest` writes it implicitly via default.
- `web/components/user-dock.tsx`, `web/components/command-palette/commands.ts`, `web/lib/auth/redirect-path.ts` (default destination).
- `web/messages/en.json`, `web/messages/br.json`.
- No judge changes. Migration numbering: check other in-flight worktrees before generating.
