# user-skills

## Purpose

Track per-user progression through the learning roadmap via per-theme and per-language skill counters, incremented on first-time lesson passes and visible on the user's profile.

## Requirements

### Requirement: Per-theme skill counter
Each user SHALL have a skill counter for each lesson theme, starting at 0.

#### Scenario: New user has zero skill
- **WHEN** a user has never passed any lesson in the "Arrays" theme
- **THEN** their "Arrays" skill value is 0

### Requirement: Per-language skill counter
Each user SHALL have a skill counter for each language supported by the judge, starting at 0.

#### Scenario: New user has zero language skill
- **WHEN** a user has never passed any lesson using the "rust" language
- **THEN** their "rust" skill value is 0

### Requirement: First-time lesson pass increments theme skill
The first time a user passes a given lesson, the system SHALL increment the theme skill counter for every theme tagged on that lesson, for that user, by 1.

#### Scenario: First pass increments theme skill
- **WHEN** a user passes a "Loops" lesson for the first time
- **THEN** the system increments that user's "Loops" theme skill value by 1

#### Scenario: First pass on a multi-theme lesson increments every tagged theme
- **WHEN** a user passes for the first time a lesson tagged with `strings`, `arrays`, and `conditionals`
- **THEN** the system increments that user's "Strings", "Arrays", and "Conditionals" theme skill values each by 1

#### Scenario: Repeat pass does not increment theme skill
- **WHEN** a user has already passed a given lesson and passes it again (e.g. resubmitting)
- **THEN** the system does not increment any of that lesson's theme skill values again

### Requirement: First-time lesson pass increments language skill
The first time a user passes a given lesson, the system SHALL increment the skill counter for the language used in that passing submission by 1.

#### Scenario: First pass increments language skill
- **WHEN** a user passes a lesson for the first time by submitting a "cpp" solution
- **THEN** the system increments that user's "cpp" language skill value by 1

#### Scenario: Passing the same lesson again in a different language does not double-award
- **WHEN** a user has already earned credit for a lesson via a "python" submission, and later passes the same lesson again via a "java" submission
- **THEN** the system does not increment the "java" language skill or the theme skill, since the lesson was already completed

### Requirement: Skill increments are atomic under concurrent passes
Concurrent passing submissions for the same user and lesson SHALL result in at most one skill increment for that lesson.

#### Scenario: Two simultaneous passing submissions
- **WHEN** two submissions for the same user and lesson both transition to a passing state at nearly the same time
- **THEN** the system records only one first-completion for that lesson and increments the theme and language skills only once

### Requirement: Skill values are visible to the user
The system SHALL display a user's per-theme and per-language skill values on their profile.

#### Scenario: Viewing own skills
- **WHEN** a user views their profile
- **THEN** the system displays their current skill value for each theme and each language
