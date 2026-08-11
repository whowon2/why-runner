## ADDED Requirements

### Requirement: Users browse published tracks
The system SHALL provide a track-browsing view listing every published track, before a user selects one to view its lesson roadmap.

#### Scenario: Browsing published tracks
- **WHEN** a user opens the track-browsing view
- **THEN** the system displays every published track with its title and description

#### Scenario: Selecting a track opens its roadmap
- **WHEN** a user selects a published track from the browsing view
- **THEN** the system displays that track's roadmap (its lessons grouped and ordered as below), scoped to that track only

## MODIFIED Requirements

### Requirement: Lessons are grouped by theme
Each lesson entry SHALL be tagged with one or more themes from a fixed set (`strings`, `arrays`, `loops`, `conditionals`). A track's roadmap SHALL present that track's lesson entries grouped and ordered by theme, with a lesson entry appearing in every theme section it is tagged with. Lesson entries in other tracks SHALL NOT appear.

#### Scenario: Lesson list grouped by theme within a track
- **WHEN** a user opens a track's roadmap
- **THEN** the system displays that track's lesson entries organized into theme sections (e.g. "Strings", "Arrays", "Loops", "Conditionals"), each listing its lesson entries in order, with no entries from other tracks

#### Scenario: Lesson has at least one theme
- **WHEN** a lesson entry is created
- **THEN** the system requires at least one theme value from the fixed set and rejects a lesson entry with zero themes or any theme value outside the fixed set

#### Scenario: Lesson tagged with multiple themes appears in each section
- **WHEN** a lesson entry (e.g. a palindrome-check exercise) is tagged with `strings`, `arrays`, and `conditionals`
- **THEN** its track's roadmap displays that lesson entry in the "Strings" section, the "Arrays" section, and the "Conditionals" section

### Requirement: Lessons within a theme are ordered
Within a track, lesson entries in a theme SHALL have an explicit order position scoped to that track, and the track's roadmap SHALL display them in that order.

#### Scenario: Sequential display within a track
- **WHEN** a user views the "Loops" theme section of a track's roadmap
- **THEN** lesson entries are listed in ascending order position (scoped to that track), not creation order or alphabetical order

### Requirement: Lesson page provides navigation chrome
The lesson page SHALL present a page-level header (lesson title, its theme tags, and its completion/lock state) separate from the problem statement content, SHALL provide a control that navigates back to the lesson entry's track roadmap, and SHALL provide a control that navigates to the next lesson entry in that same track's order, when a next lesson entry exists in that track.

#### Scenario: Header shows lesson identity and state
- **WHEN** a user opens a lesson page
- **THEN** the system displays the lesson's title, its theme tags, and its completion/lock badge in a header area above the lesson content

#### Scenario: Back to the lesson's track roadmap
- **WHEN** a user on a lesson page activates the back control
- **THEN** the system navigates the user to the roadmap of the track that lesson entry belongs to

#### Scenario: Next lesson exists in the same track
- **WHEN** a user is on a lesson page and another lesson entry in the same track has the next-higher order value
- **THEN** the system displays a next-lesson control that, when activated, navigates to that lesson entry's page

#### Scenario: Next lesson does not exist in the same track
- **WHEN** a user is on the lesson page with the highest order value within its track
- **THEN** the system does not display a next-lesson control

#### Scenario: Next lesson may be locked
- **WHEN** the next lesson entry by order within the same track is locked for the current user
- **THEN** the next-lesson control still navigates to that lesson entry's page, which then renders its own locked-state content
