## Context

Contest creation today is a 3-step dialog (`create/dialog.tsx` + `create/form.tsx`) that must collect name, start date, duration, privacy, and at least one problem before `createContest` is ever called — nothing exists in the DB until the whole wizard is completed. The `contest` table (`drizzle/schemas/contests.ts`) has no status concept; `startDate`/`endDate` are `notNull()`, and "has this contest started" is inferred ad-hoc by comparing `new Date()` against those columns (e.g. `beforeStart` in `tabs/management/index.tsx:20`). The Manage tab mixes config editing (name only, via `EditContestForm`), a Danger Zone (delete), and live-operations UI (participants, pending joins, submissions, export) in one scrolling page, gated only by `contest.createdBy === user.id`.

Stakeholder: contest organizers (any authenticated user creating a contest for others to join).

## Goals / Non-Goals

**Goals:**
- Creating a contest is a single click producing a persisted draft row immediately (no required fields up front).
- Organizers can edit all contest fields (name, description, dates, privacy, problems) at any time before publishing, and are explicitly gated from doing so after start once published (existing `beforeStart` behavior preserved for published contests).
- Introduce an explicit `draft`/`published` lifecycle so "can edit everything" vs "is live" is a real column, not inferred from dates.
- Split Settings (config + danger zone) from Manage (live operations) as distinct tabs, both creator-only.
- Draft contests are invisible to everyone except their creator (not listed publicly, not joinable).

**Non-Goals:**
- No multi-stage publish workflow (review/approval) — publish is a single validated action.
- No support for un-publishing a contest back to draft, or editing dates after a contest has started (published or not) — out of scope, matches current `beforeStart` restriction.
- No changes to judge/Rust side, submission grading, or leaderboard logic.
- Not building contest templates or duplication — "Create Contest" always creates a blank draft.

## Decisions

**1. Add `status` enum column instead of inferring from nullability of dates.**
A pgEnum `contest_status` (`draft`, `published`) on `contest`, defaulting to `draft`. Alternative considered: infer "draft" from `startDate IS NULL`. Rejected — conflates "not configured yet" with "not started yet," and the existing `beforeStart` check (comparing dates) still needs to keep working independently for published contests that haven't started. Two orthogonal concepts (configured/published vs. started/running) need two signals.

**2. Make `startDate`/`endDate`/`problems` nullable-at-creation, required-at-publish.**
`contest.startDate`/`endDate` become nullable timestamps; `name` keeps a DB default (e.g. `"Untitled Contest"`) so the insert never needs caller-supplied required fields. Validation that "these must be filled in" moves from the create-form Zod schema to a `publishContest` server-side check. Alternative considered: keep columns `notNull` and populate with placeholder sentinel values (e.g. `startDate = now()`). Rejected — sentinel dates are indistinguishable from a real (bad) configuration and complicate the publish-readiness check.

**3. `createContest` becomes a zero-argument (per-user) action.**
New signature: `createContest()` — takes no body, just inserts `{ name: "Untitled Contest", description: "", createdBy, slug: generateSlug(...) , status: "draft" }` and returns the row. The client immediately navigates to `/contests/[slug]?tab=settings`. Alternative considered: keep taking optional partial input. Rejected — the whole point is zero friction; any optional-fields API invites the old wizard back in disguise.

**4. New `publishContest(contestId)` server action.**
Validates: name non-empty, `startDate`/`endDate` set with `startDate > now()` and `endDate > startDate`, at least one problem attached, caller is `createdBy`, and `status === "draft"`. On success, sets `status = "published"`. Returns validation errors as a structured list (field → message) so the Settings UI can surface exactly what's missing, rather than a single generic error.

**5. Settings tab replaces the create wizard's form UI, reusing its field-level components.**
`BasicInfoStep`'s individual fields (name/date/duration-or-endDate/isPrivate) and `ProblemsStep`'s problem picker are extracted into the expanded `EditContestForm` used by the Settings tab, rather than kept as wizard-only components. The 3-step stepper chrome (`steps`, progress indicator) is deleted — Settings shows all fields on one page, sectioned, since there is no ordering constraint once nothing is submitted mid-flow.

**6. Manage tab visibility split: Settings always available to creator; Manage tab shown only once `status === "published"`.**
Rationale: "managing a running contest" (participants joining, submissions, export) is meaningless before publish — nobody can join or submit to a draft. Alternative considered: show Manage tab always with empty states. Rejected — adds dead-end UI for no benefit; simpler to just not render the tab trigger until published (mirrors existing pattern where `manage` tab trigger is already conditionally rendered on `createdBy`).

**7. Draft-contest visibility enforced in existing list/detail queries, not a new authz layer.**
The contest list query and `useContest`/detail fetch (wherever they currently filter/join) add `OR createdBy = currentUser.id` alongside `status = 'published'` so drafts only surface to their owner. This reuses existing auth-check patterns (`getCurrentUser`) already used by `update-contest.ts`/`delete-contest.ts`.

## Risks / Trade-offs

- [Existing draft rows with incomplete data linger indefinitely if a user abandons creation] → Acceptable for now (matches "let them fill it in calmly" intent); not adding a cleanup job. Could revisit with a "delete stale drafts after N days" sweep later if it becomes a problem.
- [Nullable `startDate`/`endDate` ripple into every place that currently assumes non-null timestamps, e.g. `beforeStart` comparison, leaderboard, sorting by date] → Mitigation: audit all read-sites of `contest.startDate`/`endDate` during implementation (tasks.md) and guard with `status === "published"` checks or null-coalescing before comparing.
- [Breaking `createContest` signature affects any other caller] → Mitigation: grep confirmed only `use-create-contest.tsx` → `create/form.tsx` call it; both are being rewritten in this change.
- [Removing the create dialog's `?createContest=true` deep link changes bookmarked/shared URLs] → Mitigation: keep the query param triggering the create action itself (fire-and-redirect) rather than opening a dialog, so existing links still do something reasonable.

## Migration Plan

1. Drizzle migration: add `contest_status` enum + `status` column (default `draft`, backfill existing rows to `published` since they were all created under the old always-configured flow), relax `startDate`/`endDate` to nullable, add DB default for `name`.
2. Ship `publishContest` action + updated `updateContest` covering all fields.
3. Ship new Settings tab UI + stripped-down Manage tab, gated on `status`.
4. Replace create dialog/button with direct-create-and-redirect.
5. Remove now-dead wizard components (`create/dialog.tsx`, `create/form.tsx` step components) once Settings tab covers their fields.
6. Rollback: revert migration is additive/nullable-relaxing only (no data loss on down-migration except dropping `status`, which is safe since existing behavior only used dates).

## Open Questions

- Should draft contests be deletable without the `beforeStart` restriction currently gating the Danger Zone (since a draft by definition hasn't started)? (Leaning: yes — Danger Zone should always be available for drafts; tasks.md will confirm against `delete-contest.ts`'s current guard.)
- Exact copy/UX for publish-validation errors (inline per-field vs. a summary banner) — left to implementation, not a spec-level concern.
