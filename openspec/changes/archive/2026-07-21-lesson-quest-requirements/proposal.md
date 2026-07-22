## Why

Lessons currently unlock in a flat, ordered list with no gating — a beginner can attempt a hard lesson before building the underlying skill, and there's no visible incentive framing for why a lesson matters. Presenting lessons as RPG-style quests, each with explicit skill requirements to attempt and explicit rewards for completing, gives the roadmap a sense of progression and lets harder lessons gate on prerequisite skill levels (e.g. a lesson requiring `strings` level 20 and `arrays` level 15).

## What Changes

- Lessons can declare a set of requirements: minimum per-theme and/or per-language skill values a user must have to attempt the lesson.
- Lessons can declare rewards shown to the user: the theme(s)/language skill gains earned on first pass (already computed via existing skill-increment logic; this makes them visible up front rather than only inferable).
- The roadmap displays each lesson as a quest card: requirements, rewards, and a locked/unlocked state based on whether the current user's skills meet the lesson's requirements.
- A locked lesson (requirements not met) is visibly locked on the roadmap and the system rejects submission attempts against it.
- **BREAKING**: submitting to a lesson whose requirements the user does not meet now fails (previously any lesson was submittable regardless of order).

## Capabilities

### New Capabilities
- `lesson-requirements`: defines lesson prerequisite requirements (per-theme/per-language minimum skill values), reward visibility, and requirement-gated submission enforcement.

### Modified Capabilities
- `learning-roadmap`: roadmap display gains locked/unlocked quest state per lesson, plus requirement and reward display, driven by the new `lesson-requirements` capability.

## Impact

- `web/drizzle/schemas/lessons.ts`: new table(s) for lesson requirements (theme/language + min value) tied to `lesson.id`.
- `web/lib/actions/lessons/get-roadmap.ts`: include requirements/rewards and compute locked state per lesson against the current user's skills.
- Lesson submission path (wherever a lesson-linked submission is created, e.g. `web/lib/actions/submissions/...`): reject submissions for locked lessons.
- Roadmap UI components: render quest-style requirement/reward/lock affordances.
- New Drizzle migration.
