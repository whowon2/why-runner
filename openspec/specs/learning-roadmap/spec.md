# learning-roadmap

## Purpose

Give users a structured, ordered path to learn competitive-programming fundamentals — strings, arrays, loops, conditionals — as judged lessons layered on top of the existing problem/submission pipeline.

## Requirements

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

### Requirement: Lessons within a theme are ordered
Lessons within a theme SHALL have an explicit order position, and the roadmap SHALL display them in that order.

#### Scenario: Sequential display
- **WHEN** a user views the "Loops" theme section
- **THEN** lessons are listed in ascending order position, not creation order or alphabetical order

### Requirement: Lesson reuses the judged problem/submission pipeline
A lesson SHALL be backed by an existing judged problem. Submitting an answer to a lesson SHALL create a submission that is graded through the same pipeline used for contest problems.

#### Scenario: Submitting a lesson answer
- **WHEN** a user submits code for a lesson
- **THEN** the system creates a submission row linked to the lesson's underlying problem and the judge grades it exactly as it would a contest submission

### Requirement: Lesson submission accepts any supported language
A lesson MAY be tagged with a primary language, but the system SHALL allow submission in any language supported by the judge, regardless of the lesson's primary language.

#### Scenario: Submitting in a non-primary language
- **WHEN** a lesson's primary language is `python` and a user submits a correct solution written in `rust`
- **THEN** the system accepts and grades the submission normally, with no restriction based on the lesson's primary language

### Requirement: Roadmap shows completion state
The roadmap SHALL indicate, per lesson, whether the current user has completed it, and whether the lesson is locked or unlocked for that user based on the lesson's requirements. Each lesson SHALL be presented as a quest, showing its requirements and its rewards alongside its completion and lock state.

#### Scenario: Completed lesson marked
- **WHEN** a user has a passing submission recorded as the first completion for a lesson
- **THEN** the roadmap displays that lesson as completed for that user

#### Scenario: Not-yet-attempted lesson
- **WHEN** a user has never passed a given lesson
- **THEN** the roadmap displays that lesson as not completed

#### Scenario: Locked lesson displays requirements
- **WHEN** a user views a lesson they have not unlocked
- **THEN** the roadmap displays the lesson as locked and shows the specific theme/language requirements and thresholds the user has not yet met

#### Scenario: Unlocked lesson displays rewards
- **WHEN** a user views a lesson they have unlocked (or that has no requirements)
- **THEN** the roadmap displays the lesson as unlocked and shows the skill rewards earned on first pass
