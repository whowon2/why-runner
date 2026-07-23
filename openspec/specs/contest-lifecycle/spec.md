## Purpose

Defines the contest lifecycle: how a contest is created as a draft, who can see draft contests, the validation required to publish a draft, and the editing restrictions that apply once a contest is published and has started.

## Requirements

### Requirement: Instant draft creation
Clicking "Create Contest" SHALL immediately create a persisted contest with `status = draft` and no required user input, then navigate the user to that contest's Settings tab. The system SHALL NOT show a multi-step form before the contest row exists.

#### Scenario: User clicks Create Contest
- **WHEN** an authenticated user clicks "Create Contest"
- **THEN** a new contest row is created with `status = draft`, a generated unique slug, `createdBy` set to the current user, and default placeholder values for name/description
- **AND** the user is navigated to `/contests/{slug}?tab=settings`

### Requirement: Draft contest visibility
Contests with `status = draft` SHALL be visible only to their creator. Draft contests SHALL NOT appear in the public contest list, leaderboard, or be joinable by any other user.

#### Scenario: Other user browses contest list
- **WHEN** a user who is not the creator views the contest list or attempts to open a draft contest's URL directly
- **THEN** the draft contest is not shown in the list and the direct URL access is treated as not found

#### Scenario: Creator browses contest list
- **WHEN** the creator of a draft contest views the contest list
- **THEN** their own draft contest is visible to them (e.g. marked as "Draft")

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

### Requirement: Published contest editing restrictions
Once a contest is `published`, its `startDate`, `endDate`, and problem list SHALL remain editable only until the contest's `startDate` has passed (matching existing pre-start editing behavior), and SHALL become read-only once the contest has started.

#### Scenario: Editing a published contest before it starts
- **WHEN** the creator edits a published contest whose `startDate` is still in the future
- **THEN** the edit is accepted and saved

#### Scenario: Editing a published contest after it starts
- **WHEN** the creator attempts to edit a published contest whose `startDate` has already passed
- **THEN** the editable fields are disabled/rejected, consistent with current pre-start-only editing behavior

### Requirement: Draft status display is independent of dates
While a contest's `status` is `draft`, the system SHALL display and treat it as `draft` regardless of whether `startDate`/`endDate` are set, in the future, in progress, or in the past. Only the explicit publish action SHALL change a contest's displayed/effective status away from `draft`.

#### Scenario: Draft with a past-dated range still shows as draft
- **WHEN** a draft contest has a `startDate` and `endDate` that have already passed
- **THEN** the contest list and contest detail page display it as `draft`, not `past`

#### Scenario: Draft with a current date range still shows as draft
- **WHEN** a draft contest has a `startDate` in the past and `endDate` in the future (i.e. dates that would otherwise imply "active")
- **THEN** the contest list and contest detail page display it as `draft`, not `active`

#### Scenario: Draft with a future date range still shows as draft
- **WHEN** a draft contest has a `startDate` and `endDate` both in the future
- **THEN** the contest list and contest detail page display it as `draft`, not `upcoming`

#### Scenario: Editing dates on a draft does not publish it
- **WHEN** the creator edits and saves start/end dates on a draft contest via the Settings form
- **THEN** the contest's `status` remains `draft` in the database and in the UI, without requiring the explicit publish action
