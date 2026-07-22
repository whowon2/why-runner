## Context

WhyRunner (`web/` Next.js + Drizzle/Postgres, `judge/` Rust sandbox worker) already has `problem`, `submission`, `contest`, and `user` tables and a working judged-submission pipeline (submit code → `PENDING` row → `pg_notify` → judge grades → `PASSED`/`FAILED`/`ERROR`). This change adds a learning roadmap on top of that pipeline: themed/language-tagged lessons, ordered into a path, with per-user skill counters that increment on first pass. No changes to `judge/` — lessons are graded exactly like contest problems.

## Goals / Non-Goals

**Goals:**
- Define a lesson model that reuses `problem`/`submission` for grading, decoupled from `contest`.
- Track per-theme (strings, arrays, loops, conditionals, ...) and per-language (c, cpp, java, python, portugol, rust) skill counters per user.
- Increment the theme skill (always) and the language skill (for the language actually used) by +1 the first time a user passes a given lesson — never on subsequent passes of the same lesson.
- Let a user submit any lesson in any judge-supported language, independent of the lesson's "primary" tagged language.
- Present an ordered roadmap (themes as tracks, lessons within a track ordered by difficulty/sequence).

**Non-Goals:**
- No new sandboxing/grading logic — lessons ride the existing judge pipeline unchanged.
- No badges, streaks, leaderboards, or XP curves beyond the flat +1-per-first-pass counter.
- No lesson authoring UI in this change — lessons are seeded/managed the same way problems are today (admin-created rows), a full authoring UI is a future change.
- Skill values are not used to gate contest access in this change.

## Decisions

**Lesson = a `problem` row + a `lesson` row (1:1), not a new problem type.**
A `lesson` table references `problem.id` and adds roadmap-specific fields: `theme`, `order` (position within theme), and an optional `primaryLanguage`. This reuses all existing problem-authoring, submission, and judging logic instead of forking it. Alternative considered: bake theme/order directly onto `problem` — rejected because it would pollute the general problem model (used by contests too) with roadmap-only concerns.

**Theme is a Postgres enum (`lesson_theme`: `strings`, `arrays`, `loops`, `conditionals`), mirroring how `Language` and `SubmissionStatus` are already modeled as `pgEnum`.** Keeps themes closed and validated at the DB level, consistent with existing schema style. Adding a new theme later is a migration, same cost as adding a new `Language` value today.

**Skills are two counter tables, not one generic `(subject_type, subject_key)` table.** `user_theme_skill(user_id, theme, value)` and `user_language_skill(user_id, language, value)`, both keyed by the existing `LessonTheme`/`Language` enums with a composite PK. A single polymorphic table was considered but rejected: it would need a text discriminator instead of reusing the two existing enums, losing FK-style validation for little benefit at this scale (8 themes/languages total).

**First-pass detection via a new `lesson_completion(user_id, lesson_id, language, completed_at)` table**, not by scanning `submission` history. On a submission transitioning to `PASSED` for a `problem_id` that has a matching `lesson`, check whether a `lesson_completion` row already exists for `(user_id, lesson_id)`:
- If none exists: insert one (recording the language used), +1 the theme skill, and +1 the language skill for that submission's language.
- If one exists: no-op (re-passing, or passing again in a different language, does not re-award skill). This matches the proposal's "first-time" wording — language skill is earned once per lesson via whichever language first passed it, not once per (lesson, language) pair. This is the more conservative reading and avoids letting a user farm 6x language-skill by resubmitting one lesson in every language.

**Hook point: server-side submission-status-update path in `web/`** (wherever judge results are written back / polled and `submission.status` flips to `PASSED`), not a DB trigger. Keeps the increment logic in application code alongside existing submission handling, easier to test and reason about than PL/pgSQL, consistent with `judge/CLAUDE.md`/`web/CLAUDE.md` split (judge only grades, web owns all business/state logic).

## Risks / Trade-offs

- [Race: two submissions for the same lesson pass concurrently, both see "no completion row yet"] → Insert `lesson_completion` with a unique constraint on `(user_id, lesson_id)` and wrap the check-then-increment in a transaction; on unique-violation, treat as already-completed and skip the skill increment.
- [Enum migration cost: adding a new theme later requires an `ALTER TYPE` migration] → Accepted; matches existing precedent (`Language`, `SubmissionStatus` are already enums) and themes are expected to change rarely.
- [Scope creep toward gamification features (badges/streaks) during implementation] → Explicitly listed as Non-Goal; keep the counter flat in this change.

## Migration Plan

1. Add Drizzle schema + migration: `lesson_theme` enum, `lesson` table, `lesson_completion` table, `user_theme_skill` table, `user_language_skill` table.
2. Backfill: none needed (new tables, no existing data to migrate).
3. Ship server actions/routes for roadmap listing, lesson detail, submission-to-lesson linkage, and the skill-increment hook.
4. Ship roadmap + skill-display UI.
5. Rollback: drop the new tables/enum via a down migration; no existing tables are altered, so rollback carries no risk to contests/problems/submissions.

## Open Questions

- Should skill values ever decay or reset (e.g., per season)? Deferred — out of scope for v1.
- Should lessons be allowed to have prerequisites beyond simple in-theme ordering (e.g., cross-theme gating)? Deferred — v1 uses flat per-theme ordering only.
