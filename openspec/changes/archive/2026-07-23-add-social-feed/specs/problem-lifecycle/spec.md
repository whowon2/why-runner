## MODIFIED Requirements

### Requirement: Publish validation
The system SHALL provide a publish action that transitions a problem from `draft` to `published` only when title is non-empty, description is non-empty, difficulty is set, and at least one test case (a matching input/output pair) is present. The system SHALL reject publishing an already-published problem or a problem the caller does not own. On successful publish, the system SHALL create the corresponding `activityFeed` entry (`PROBLEM_CREATED`) as part of the publish action itself, without requiring any additional client-side confirmation step (no share dialog).

#### Scenario: Publish with incomplete configuration
- **WHEN** the creator attempts to publish a draft problem missing a title, description, difficulty, or with no test cases
- **THEN** the publish action fails and returns which required fields are missing, and the problem remains `draft`

#### Scenario: Publish with valid configuration
- **WHEN** the creator attempts to publish a draft problem that has a title, description, difficulty, and at least one test case
- **THEN** the problem's `status` becomes `published`, an `activityFeed` entry is created for the publish event, and the problem becomes visible to other users per existing problem visibility rules

#### Scenario: Non-owner attempts publish
- **WHEN** a user who is not the problem's creator calls the publish action
- **THEN** the action is rejected and the problem status is unchanged

#### Scenario: Publish does not require share confirmation
- **WHEN** a problem is published successfully
- **THEN** the activity feed entry exists immediately and the user is not shown a modal dialog they must dismiss or fill out before continuing
