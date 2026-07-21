## Why

WhyRunner has contests and problems but no structured onboarding path — new users land on a judged platform with no guided way to learn the fundamentals (strings, arrays, loops, conditionals) before competing. A lessons roadmap with skill tracking gives beginners a guided, language-agnostic on-ramp and gives the platform a progression/gamification hook.

## What Changes

- Add a **learning roadmap** feature: an ordered sequence of lessons grouped by theme (strings, arrays, loops, conditionals) and by language (any language already supported by the judge: c, cpp, java, python, portugol, rust).
- Each lesson is a judged coding exercise (reuses existing problem/submission/judge pipeline) tagged with one theme and optionally one language.
- Add **per-user skill values**: one skill counter per theme and one per language. Completing (passing) a lesson for the first time increments the corresponding skill(s) by +1.
- Users may submit a lesson's answer in **any** language supported by the system, not just the lesson's tagged language — passing awards the theme skill regardless of language, and additionally awards that language's skill.
- Add a roadmap UI: lesson list/tree with completion state, per-theme/per-language skill display on user profile.

## Capabilities

### New Capabilities
- `learning-roadmap`: Ordered lessons grouped by theme/language, lesson detail view, prerequisite/ordering rules, completion tracking.
- `user-skills`: Per-user, per-theme and per-language skill counters; +1 increment rule on first-time lesson pass; skill display.

### Modified Capabilities
- (none — lessons reuse the existing problem/submission/judging capabilities without changing their requirements; roadmap layers on top via new tables/relations)

## Impact

- `web/`: new Drizzle tables (e.g. `lesson`, `lesson_theme`, `user_skill`, `user_lesson_progress`) plus migrations; new server actions/routes for roadmap listing, lesson detail, and skill lookup; new UI routes/components for the roadmap and profile skill display.
- Submission flow: on a submission transitioning to `PASSED` for a lesson-linked problem, trigger a first-pass check and skill increment (theme skill always; language skill for the language actually used).
- No changes required in `judge/` — lessons run through the existing submission/grading pipeline unchanged.
