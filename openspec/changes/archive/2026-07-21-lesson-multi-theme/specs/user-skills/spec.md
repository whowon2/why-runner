## MODIFIED Requirements

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
