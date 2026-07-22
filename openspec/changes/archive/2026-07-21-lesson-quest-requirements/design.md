## Context

Lessons already carry themes (`lessonTheme`) and drive per-user skill counters (`userThemeSkill`, `userLanguageSkill`) via `awardLessonCompletionIfFirstPass`. The roadmap (`getRoadmap`) currently returns lessons grouped by theme with only a `completed` flag. This change adds a prerequisite-gate layer on top of that existing skill system, framing lessons as quests.

## Goals / Non-Goals

**Goals:**
- Let a lesson declare minimum theme/language skill thresholds required to attempt it.
- Compute, per user, whether each lesson is locked/unlocked from existing skill tables.
- Surface requirements and rewards on the roadmap.
- Enforce the lock server-side at submission time, not just in the UI.

**Non-Goals:**
- No new skill-earning mechanism — rewards shown are exactly what `awardLessonCompletionIfFirstPass` already grants; this change only makes them visible and gates on them.
- No admin UI for authoring requirements in this change — requirements are seeded/managed the same way lessons/themes currently are (seed script / direct insert).
- No requirement types beyond theme-skill and language-skill minimums (no "requires lesson X completed", no OR-groups).

## Decisions

**Two new tables, mirroring the existing skill tables.** `lessonThemeRequirement (lessonId, theme, minValue)` and `lessonLanguageRequirement (lessonId, language, minValue)`, each PK'd on `(lessonId, theme|language)`. This mirrors `userThemeSkill`/`userLanguageSkill` 1:1, keeping the "requirement" and "skill" shapes symmetric so a locked check is a simple per-row comparison. Alternative considered: one polymorphic `lessonRequirement(lessonId, kind, key, minValue)` table — rejected, since the fixed `LessonTheme`/`Language` enums already give strong typing per-column and a polymorphic key column would lose that.

**Lock computation happens in `getRoadmap`, in-memory.** Fetch the user's `userThemeSkill`/`userLanguageSkill` rows alongside lessons' requirement rows in the same query batch already used for completions, then compare in JS. Requirement/skill counts are small (bounded by enum sizes × lesson count), so no need for a SQL-side join computation.

**Submission-time enforcement lives at the point a lesson-linked submission is created** (alongside the existing rate-limit/contest-acceptance checks in the submission action), re-deriving the same locked/unlocked check server-side rather than trusting a client-supplied flag. This is the same trust boundary already used for rate limiting.

**Rewards are derived, not stored.** A lesson's reward is exactly: +1 to each theme in `lessonTheme` for that lesson, +1 to the submission's language skill. No new column needed — the roadmap read simply surfaces the lesson's existing `themes` relation as "rewards," consistent with what `awardLessonCompletionIfFirstPass` already does.

## Risks / Trade-offs

- [Requirement thresholds reference themes/languages that could theoretically be removed from the enum] → Enums (`LessonTheme`, `Language`) are stable, hand-synced values shared with the judge; no removal path exists today, so this is accepted as-is, same as existing skill tables.
- [Locking a lesson that's already completed by a user whose skill later regresses — skills never decrease today] → Not reachable: skill values are monotonically increasing (only incremented, never decremented), so a completed lesson can never re-lock.
- [Extra query cost on roadmap load for skill rows] → Bounded by enum cardinality (4 themes, N languages) per user; negligible.

## Migration Plan

- Add `lesson_theme_requirement` and `lesson_language_requirement` tables via Drizzle migration; no backfill needed (existing lessons simply have zero requirement rows → unlocked for everyone, preserving current behavior).
- Ship lock enforcement and requirement/reward display in the same change so there's no window where the UI shows locks that the server doesn't enforce (or vice versa).
