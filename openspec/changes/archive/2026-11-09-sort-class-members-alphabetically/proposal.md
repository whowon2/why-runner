## Why

In the 2026-10-29 classroom test the professor asked for the class's students to be listed alphabetically (P10 in `docs/evaluation/professor-survey-review.md`). The class page roster is ordered by `joinedAt`, so finding a student in a class of 20+ means scanning the whole list. The gradebook and results export already sort by name, but with the server's default `localeCompare`, not an explicit pt-BR, case- and accent-insensitive collation.

## What Changes

- Add one shared name comparator (`Intl.Collator("pt-BR", { sensitivity: "base" })`, ties broken by username) used everywhere a class roster is ordered.
- Class page: students list and co-teacher list ordered by name with that comparator instead of `joinedAt`. Teachers card (owner, then co-teachers) stays above the students card.
- Gradebook and detailed results export: switch their sort to the shared comparator, so all three views order students identically.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `classes`: adds a requirement that the class roster lists teachers first, then students, each ordered by name (pt-BR, case/accent-insensitive).
- `class-gradebook`: "ordered by name" now specifies the pt-BR, case/accent-insensitive collation with username tiebreak.
- `class-results-export`: student ordering uses the same collation.

## Impact

- `web/lib/actions/classes/get-class.ts`, `web/lib/gradebook.ts`, `web/lib/class-results.ts`, new `web/lib/compare-by-name.ts` (+ test).
- No DB, API shape or judge changes. Web patch version bump.
