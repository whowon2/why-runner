## MODIFIED Requirements

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
