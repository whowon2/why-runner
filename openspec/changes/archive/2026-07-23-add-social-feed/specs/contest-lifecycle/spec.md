## MODIFIED Requirements

### Requirement: Publish validation
The system SHALL provide a publish action that transitions a contest from `draft` to `published` only when name is non-empty, `startDate` and `endDate` are set with `startDate` in the future and `endDate` after `startDate`, and at least one problem is attached. The system SHALL reject publishing an already-published contest or a contest the caller does not own. On successful publish, the system SHALL create the corresponding `activityFeed` entry (`CONTEST_CREATED`) as part of the publish action itself, without requiring any additional client-side confirmation step (no share dialog).

#### Scenario: Publish with incomplete configuration
- **WHEN** the creator attempts to publish a draft contest missing a start date or with no problems attached
- **THEN** the publish action fails and returns which required fields are missing, and the contest remains `draft`

#### Scenario: Publish with valid configuration
- **WHEN** the creator attempts to publish a draft contest that has a name, valid start/end dates, and at least one problem
- **THEN** the contest's `status` becomes `published`, an `activityFeed` entry is created for the publish event, and it becomes visible/joinable to other users per existing contest visibility rules

#### Scenario: Non-owner attempts publish
- **WHEN** a user who is not the contest's creator calls the publish action
- **THEN** the action is rejected and the contest status is unchanged

#### Scenario: Publish does not require share confirmation
- **WHEN** a contest is published successfully
- **THEN** the activity feed entry exists immediately and the user is not shown a modal dialog they must dismiss or fill out before continuing
