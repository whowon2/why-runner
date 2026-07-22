## MODIFIED Requirements

### Requirement: Lessons are grouped by theme
Each lesson SHALL be tagged with one or more themes from a fixed set (`strings`, `arrays`, `loops`, `conditionals`). The roadmap SHALL present lessons grouped and ordered by theme, with a lesson appearing in every theme section it is tagged with.

#### Scenario: Lesson list grouped by theme
- **WHEN** a user opens the roadmap
- **THEN** the system displays lessons organized into theme sections (e.g. "Strings", "Arrays", "Loops", "Conditionals"), each listing its lessons in order

#### Scenario: Lesson has at least one theme
- **WHEN** a lesson is created
- **THEN** the system requires at least one theme value from the fixed set and rejects a lesson with zero themes or any theme value outside the fixed set

#### Scenario: Lesson tagged with multiple themes appears in each section
- **WHEN** a lesson (e.g. a palindrome-check exercise) is tagged with `strings`, `arrays`, and `conditionals`
- **THEN** the roadmap displays that lesson in the "Strings" section, the "Arrays" section, and the "Conditionals" section
