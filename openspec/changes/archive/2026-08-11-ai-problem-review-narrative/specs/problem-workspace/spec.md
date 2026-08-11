## MODIFIED Requirements

### Requirement: Task tab shows description and limits
The Task tab SHALL show the problem's description, examples, time limit, and memory limit. When the problem has a narrative set, the Task tab SHALL display the narrative above the technical description, styled distinctly (e.g. as themed/flavor text) so it is visually distinguishable from the problem specification.

#### Scenario: Limits displayed
- **WHEN** a user views the Task tab
- **THEN** the system SHALL display the problem's time limit in seconds and memory limit in megabytes alongside the description

#### Scenario: Narrative displayed when present
- **WHEN** a user views the Task tab of a problem that has a narrative set
- **THEN** the system SHALL render the narrative above the description, visually distinguished as flavor text

#### Scenario: No narrative set
- **WHEN** a user views the Task tab of a problem with no narrative set
- **THEN** the system SHALL render the description as before, with no narrative section shown
