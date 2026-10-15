## MODIFIED Requirements

### Requirement: Published contest editing restrictions
Once a contest is `published`, its `startDate`, `endDate`, and problem list SHALL remain editable only until the contest's `startDate` has passed (matching existing pre-start editing behavior). They SHALL become read-only once the contest has started. The problem list covers adding, removing, and reordering. The server actions SHALL enforce this, not only the UI.

#### Scenario: Editing a published contest before it starts
- **WHEN** the creator edits a published contest whose `startDate` is still in the future
- **THEN** the edit is accepted and saved

#### Scenario: Editing a published contest after it starts
- **WHEN** the creator attempts to edit a published contest whose `startDate` has already passed
- **THEN** the editable fields are disabled/rejected, consistent with current pre-start-only editing behavior

#### Scenario: Direct action call after start
- **WHEN** the creator calls `updateContest` with new dates, or calls the add/remove/reorder problem actions, on a published contest whose `startDate` has passed, bypassing the UI
- **THEN** the action SHALL fail with a `CONTEST_STARTED` action failure and SHALL NOT modify the contest. Name, description, privacy, and AI assistance level remain editable.
