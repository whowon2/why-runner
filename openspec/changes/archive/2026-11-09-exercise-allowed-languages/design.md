## Context

`exercise.primaryLanguage` is nullable and only drives a "Suggested language" label (and, for Parsons, the solution language). `CodePane` renders `Language.enumValues` for every context. The three submit/run actions accept any `languageSchema` value. Contest problems live in the `problem_on_contest` join table (`order` is its only setting). The professor survey (P2) asked for a per-list/per-problem restriction enforced on the server, not just hidden in the UI.

## Goals / Non-Goals

**Goals:**
- One allowed-languages list per lesson exercise and per contest problem, empty = all.
- Enforcement in every action that sends student code to the judge for those contexts (submit + custom run).
- Selector, draft restore and "load past submission" respect the list.

**Non-Goals:**
- Restricting standalone problems (`/problems/[slug]`): practice stays open.
- Per-lesson or per-contest defaults that cascade to each exercise/problem (teachers set it per row; can be added later).
- Changing `primaryLanguage` semantics or the judge.

## Decisions

- **Column shape: `language[] NOT NULL DEFAULT '{}'`**, empty = unrestricted. Alternative: nullable (NULL = all, `{}` = none). Rejected: "no language allowed" is meaningless, and a non-null array avoids two spellings of "all". Existing rows get `{}` from the default, so nothing changes for them.
- **Contest restriction per problem, not per contest.** The survey asked per problem/list; a lesson is the "list" and each exercise row gets its own list. Per-contest-problem keeps the two contexts symmetric and reuses one picker component.
- **Pure helper `lib/allowed-languages.ts`** (`isLanguageAllowed(allowed, lang)`, `offeredLanguages(allowed)`, plus an `allowedLanguagesSchema` zod array with de-duplication), imported by actions and the UI so both use the same "empty = all" rule.
- **Failure, not throw:** actions return `fail("LANGUAGE_NOT_ALLOWED", { languages: allowed.join(", ") })` so the message reaches the browser in production (see `lib/action-result.ts`). Added to `ActionErrors` in `messages/`.
- **Setters as separate actions**: `setExerciseAllowedLanguages` (`assertCanManageExercise`) and `setContestProblemLanguages` (`canManageContest` + `isContestLocked` → `CONTEST_STARTED`, like add/remove/reorder). Explicit zod input, writes only the one column.
- **Contest workspace data**: `getContest` already returns full `problem_on_contest` rows, so `allowedLanguages` flows to `ContestProblemWorkspace` and the settings list without new queries. `getExercise` returns all exercise columns, same.
- **Editor wiring**: `WorkspaceSource.allowedLanguages: Language[]` (empty = all). `CodePane` filters the `Select`, and an effect replaces a selected language that is not offered (null → preselect when exactly one is offered; disallowed → `primaryLanguage` if offered, else first offered) through the same `handleLanguageChange` path so drafts/starter code behave as on a manual switch. `load()` warns and returns when the language is not offered.
- **UI for teachers**: one `AllowedLanguagesDialog` (`components/allowed-languages-dialog.tsx`, checkbox per language + save) opened from a "Languages" button on the roadmap exercise row (next to Mode / Constraints, `code` mode only) and on each contest Settings → Problems row (disabled when locked), plus read-only badges.

## Risks / Trade-offs

- [Teacher restricts after students drafted in another language] → draft stays in localStorage under that language; editor switches to an allowed language. Not lost, just not shown.
- [Submissions already graded in a now-disallowed language] → kept and still count; the restriction only applies to new submissions/runs. Acceptable: teachers set it before the activity.
- [Migration collides with a parallel worktree] → checked 2026-11-09: no other open worktree adds a migration; this is `0055`.

## Migration Plan

`0055_allowed_languages.sql`: `ALTER TABLE exercise ADD COLUMN allowed_languages language[] DEFAULT '{}' NOT NULL;` and the same for `problem_on_contest`. Additive, default-backed, safe on a live DB; rollback = drop both columns. Judge needs no deploy.
