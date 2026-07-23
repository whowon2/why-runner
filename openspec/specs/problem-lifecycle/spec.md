## Purpose

Defines the draft/published lifecycle of problems: how draft problems are created, who can see and edit them, and how they are validated and transitioned to published.

## Requirements

### Requirement: Instant draft creation
Clicking "Create Problem" SHALL immediately create a persisted problem with `status = draft` and no required user input, then navigate the user to that problem's edit view. The system SHALL NOT show a multi-step form before the problem row exists.

#### Scenario: User clicks Create Problem
- **WHEN** an authenticated user clicks "Create Problem"
- **THEN** a new problem row is created with `status = draft`, a generated unique slug, a generated unique code, `createdBy` set to the current user, and default placeholder values for title/description
- **AND** the user is navigated to that problem's edit view

### Requirement: Draft problem visibility
Problems with `status = draft` SHALL be visible only to their creator. Draft problems SHALL NOT appear in the public problems list, cannot be opened via direct slug/URL access by other users, and SHALL NOT be selectable when attaching problems to a contest by any user other than the creator.

#### Scenario: Other user browses problems list
- **WHEN** a user who is not the creator views the problems list or attempts to open a draft problem's URL directly
- **THEN** the draft problem is not shown in the list and the direct URL access is treated as not found

#### Scenario: Creator browses problems list
- **WHEN** the creator of a draft problem views the problems list
- **THEN** their own draft problem is visible to them (e.g. marked as "Draft")

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

### Requirement: Draft problem editing
Draft problems SHALL be editable in place by their creator without requiring the full set of publish-required fields to be valid, allowing the creator to save partial progress.

#### Scenario: Saving an incomplete draft
- **WHEN** the creator edits a draft problem and saves with, for example, only a title filled in
- **THEN** the edit is accepted and persisted without requiring description, difficulty, or test cases to be present

### Requirement: Bulk import bypasses the draft flow
Problems created via bulk import SHALL be created with `status = published` directly, without requiring a separate publish step.

#### Scenario: Bulk import creates published problems
- **WHEN** an authenticated user imports a batch of problems via the import feature
- **THEN** each imported problem is created with `status = published` and is immediately visible per existing problem visibility rules

### Requirement: Bulk import also assigns a code
Problems created via bulk import SHALL also be assigned a unique `code` at creation time, following the same generation scheme as problems created through the standard "Create Problem" flow.

#### Scenario: Bulk-imported problem has a code
- **WHEN** an authenticated user imports a batch of problems via the import feature
- **THEN** each imported problem is created with a non-empty, unique `code`
