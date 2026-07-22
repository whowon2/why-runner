## Why

Contest creation is currently a 3-step wizard crammed into a 425px dialog (`create/dialog.tsx`, `create/form.tsx`), forcing organizers to pick problems and finalize dates before the contest exists. There's also no way to save partial progress or revisit fields later — the Manage tab's edit form (`tabs/management/edit/form.tsx`) only exposes `name`, silently ignoring `startDate`, `endDate`, `isPrivate`, and `description` despite those being set at creation. Organizers can't calmly configure a contest over multiple sessions, and the Manage tab conflates "editing contest config" with "running the live contest" (participants, submissions, danger zone) in one long scroll.

## What Changes

- Replace `CreateContestDialog`/`CreateContestForm` wizard with a single-click action: clicking "Create Contest" immediately creates an empty **draft** contest and navigates to its Settings tab. No more upfront multi-step form.
- Add a `status` enum (`draft` | `published`) to the `contest` table. Draft contests are only visible/joinable by their creator; `startDate`/`endDate` become editable (nullable until set) rather than required at creation time.
- Add a **Publish** action (new server action) that flips a draft contest to `published`, validating required fields (name, dates, at least one problem) are filled in before allowing publish.
- Add a new **Settings** tab (creator-only) that hosts: the full editable contest form (name, description, dates, privacy, problems — expanding `EditContestForm` beyond just `name`), the Publish action (draft contests only), and the Danger Zone (delete contest), moved out of the Manage tab.
- Refactor the **Manage** tab to drop editable fields and Danger Zone; it keeps People Management (participants, pending joins), Submissions, and Export — scoped to operating a contest that's already published/running.
- **BREAKING**: `createContest` server action signature changes (no longer accepts `problems`/full config in one call); existing bookmarked `?createContest=true` dialog-open query param behavior is replaced by navigation to `/contests/[slug]?tab=settings`.

## Capabilities

### New Capabilities
- `contest-lifecycle`: draft/published contest status, instant draft creation on "Create Contest" click, and the publish action with its validation gate.
- `contest-settings`: the Settings tab — full editable contest configuration form and the Danger Zone (delete), creator-only, replacing the old create wizard and the edit section previously embedded in Manage.

### Modified Capabilities
(none — no existing `openspec/specs/` capability covers contest creation/management today; this is the first spec for this area)

## Impact

- Affected code:
  - `web/app/[locale]/contests/_components/create/` (dialog + form) — removed/replaced by direct-create + redirect.
  - `web/app/[locale]/contests/_components/tabs/index.tsx` — add `settings` tab entry, gate `manage` differently.
  - `web/app/[locale]/contests/_components/tabs/management/` — strip edit section + danger zone out; keep participants/submissions/export.
  - New `web/app/[locale]/contests/_components/tabs/settings/` — editable form + danger zone.
  - `web/lib/actions/contest/create-contest.ts` — simplified to create empty draft.
  - New `web/lib/actions/contest/publish-contest.ts`.
  - `web/lib/actions/contest/update-contest.ts` — extend to cover all editable fields.
  - `web/drizzle/schemas/contests.ts` — add `status` column + migration.
  - `web/hooks/use-create-contest.tsx`, new `use-publish-contest.tsx`.
  - i18n strings in `web/messages/en.json` (and pt equivalent) for new Settings tab, publish flow, removed create-dialog strings.
- No judge/Rust-side impact — contest status is a web/Postgres-only concept.
