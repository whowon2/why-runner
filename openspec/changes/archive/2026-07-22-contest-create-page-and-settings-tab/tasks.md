## 1. Schema & migration

- [x] 1.1 Add `contest_status` pgEnum (`draft`, `published`) in `web/drizzle/schemas/contests.ts`, add `status` column (`.default("draft").notNull()`).
- [x] 1.2 Relax `startDate`/`endDate` to nullable timestamps; add a DB default for `name` (e.g. `"Untitled Contest"`) and default `""` for `description` (already defaults via app code, confirm column-level).
- [x] 1.3 Run `bun db:generate` to create the migration, backfilling existing rows to `status = 'published'` (since all pre-existing contests were fully configured under the old flow).
- [x] 1.4 Update `judge/src/models.rs`-adjacent docs if any Rust-side enum mirrors contest status (check — likely none, judge only reads `submission` status per CLAUDE.md). No Rust-side contest status mirror exists; nothing to sync.

## 2. Server actions — lifecycle

- [x] 2.1 Rewrite `createContest` (`web/lib/actions/contest/create-contest.ts`) to take no input: create with placeholder name, empty description, `status: "draft"`, generated slug, `createdBy`. Remove the `problems` insert side-effect from this action.
- [x] 2.2 Add `web/lib/actions/contest/publish-contest.ts` (`publishContest(contestId)`): auth-check `createdBy`, validate name non-empty, `startDate`/`endDate` set with `startDate > now()` and `endDate > startDate`, at least one `problemOnContest` row exists, `status === "draft"`; on success set `status = "published"`; return structured validation errors on failure.
- [x] 2.3 Extend `updateContest` (`web/lib/actions/contest/update-contest.ts`) input type / hook (`use-update-contest.ts`) to cover all editable fields (name, description, startDate, endDate, isPrivate) plus problem attach/detach (reuse `add-problem.ts`/`remove-problem.tsx`/`reorder-problems.ts`). Action already accepts `Partial<Contest>` generically — no action-level change needed, only the UI form (task 5) needs to send more fields.
- [x] 2.4 Update `delete-contest.ts`'s `beforeStart` guard: allow deletion when `status === "draft"` regardless of `startDate` (drafts may have no `startDate` at all), keep existing `startDate` check for published contests.

## 3. Visibility & read queries

- [x] 3.1 Update `get-contests.ts` (contest list) to filter `status = 'published' OR createdBy = currentUser.id`.
- [x] 3.2 Update `get-contest-by-id.ts` / `useContest` fetch path to return 404/not-found semantics when a non-creator requests a draft contest by slug.
- [x] 3.3 Audit all remaining read-sites comparing `contest.startDate`/`endDate` as non-null (`lib/get-contest-status.ts`, `tabs/management/index.tsx`'s `beforeStart`, leaderboard, sorting in contest list) and guard against `null` dates on draft contests. Guarded: `get-contest-status.ts` (new "draft" badge), `card.tsx`, `description.tsx`, `status.tsx` (unused component, typed only), `join-and-leave.tsx`, `tabs/problem/index.tsx`, `my-contests.tsx`. `tabs/management/index.tsx`'s `beforeStart` handled in task 6 (Manage only renders for published contests, which always have dates post-publish-validation).

## 4. Create flow → direct create + redirect

- [x] 4.1 Replace `CreateContestDialog` (`create/dialog.tsx`) trigger button with a direct action: on click, call `createContest()`, then `router.push`/`redirect` to `/contests/{slug}?tab=settings`. Implemented as `create/button.tsx` (`CreateContestButton`).
- [x] 4.2 Keep the `?createContest=true` query param working as a fire-and-redirect trigger (not dialog-open) for backward compatibility with existing links (`my-contests.tsx`, `command-palette/commands.ts`).
- [x] 4.3 Delete `create/form.tsx` (wizard) and `create/dialog.tsx` once step 4.1/4.2 land and their field logic has been migrated into the Settings form (task 5).
- [x] 4.4 Update `use-create-contest.tsx` hook for the new zero-arg mutation signature.

## 5. Settings tab

- [x] 5.1 Create `web/app/[locale]/contests/_components/tabs/settings/` with an expanded `EditContestForm` covering name, description, start date, end date, isPrivate, and problem selection (port field UI from old `BasicInfoStep`/`ProblemsStep`).
- [x] 5.2 Add Publish button/section: visible only when `status === "draft"`; disabled with inline reasons when publish validation (task 2.2) would fail; calls `publishContest` and navigates/refreshes on success.
- [x] 5.3 Move `DeleteContest` (Danger Zone) from `tabs/management/index.tsx` into the new Settings tab; remove the danger-zone section from Manage.
- [x] 5.4 Move `ExportContestData` — confirm whether it belongs in Settings or stays in Manage per design (design treats export as a live-operations concern; keep in Manage unless it's needed pre-publish). Kept in Manage.

## 6. Manage tab refactor

- [x] 6.1 Strip `ContestManagement` (`tabs/management/index.tsx`) down to People Management (Participants, PendingJoins) and Submissions sections only; remove the "Overview & Settings" section and Danger Zone. Kept Export section too (5.4).
- [x] 6.2 Delete `tabs/management/edit/` (old `EditContest`/`EditContestForm`/`EditContestProblems`) once superseded by the Settings tab form, or relocate reusable pieces there. Relocated `problems.tsx`/`delete-contest.tsx` into `settings/`; deleted `edit/edit.tsx` and `edit/form.tsx` (superseded by `settings/form.tsx`).

## 7. Tabs container wiring

- [x] 7.1 In `tabs/index.tsx`, add a "Settings" `TabsTrigger`/`TabsContent`, gated on `contest.createdBy === user.id` (both draft and published).
- [x] 7.2 Gate the existing "Manage" tab trigger additionally on `contest.status === "published"` (in addition to `createdBy` check).
- [x] 7.3 Default `tab` query param: for a freshly created draft, land on `settings` (already handled by redirect in 4.1); for published contests, keep existing default (`problems`). Also defaults to `settings` for the owner on any unpublished contest reached without a `?tab=` param, not just the create-flow redirect.

## 8. i18n

- [x] 8.1 Add new message keys for Settings tab, Publish action/errors, Danger Zone under Settings, in `web/messages/en.json` and the pt equivalent (`br.json`).
- [x] 8.2 Remove now-unused `ContestsPage.createDialog` wizard-step keys once `create/form.tsx` is deleted; keep `button`/`title` keys if still referenced anywhere. Kept `button`/`failedCreate` only (still used by `create/button.tsx`); removed `title`/`steps`/`form`/etc. as unused.

## 9. Verification

- [x] 9.1 `bun lint` and `bun build` in `web/` pass. `bunx tsc --noEmit` and `bun run build` are clean; `bun lint` has 6 pre-existing failures unrelated to this change (checked via `git status`, none in touched files).
- [x] 9.2 Manual run: create contest → lands on draft Settings tab → fill fields → attempt publish with missing fields (see validation errors) → complete fields → publish → contest now visible in list and Manage tab appears → verify Settings still accessible → delete a draft contest via Danger Zone. Verified end-to-end against the real dev server + Postgres via a scripted Playwright session (chromium-cli unavailable in this environment): draft created instantly on click and redirected to `?tab=settings`; Publish disabled with "Missing: at least one problem" until a problem was attached; after Publish the contest flipped to `published` in the DB, appeared in the public contests list, and the Manage tab appeared (Export/People/Submissions only, no edit fields or Danger Zone); a separately-created draft was deleted via Settings → Danger Zone and confirmed removed from the DB.
- [x] 9.3 Verify non-creator cannot see Settings tab or a draft contest via direct URL. Verified with a second signed-up user: direct navigation to another user's draft contest URL renders the app's 404 page; the contests list for the second user does not include the first user's draft ("Untitled Contest") while it does include their published one.
