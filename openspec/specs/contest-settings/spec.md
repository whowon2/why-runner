## Purpose

Defines the contest Settings tab: a creator-only surface for full contest configuration, the publish action, and the Danger Zone, and the resulting scope reduction of the Manage tab to live-operations content only.

## Requirements

### Requirement: Settings tab access
A "Settings" tab SHALL be shown on a contest's page only to that contest's creator, for both draft and published contests. Non-creators SHALL NOT see or be able to navigate to the Settings tab.

#### Scenario: Creator views own contest
- **WHEN** the contest creator opens their contest page
- **THEN** a "Settings" tab is visible alongside Problems/Leaderboard (and Manage, if published)

#### Scenario: Non-creator views contest
- **WHEN** a user who is not the contest's creator opens the contest page
- **THEN** no "Settings" tab is rendered, and navigating directly to `?tab=settings` does not display settings content

### Requirement: Full contest configuration form
The Settings tab SHALL expose an editable form covering name, description, start date, end date, private/public toggle, and attached problems — replacing the previous Manage-tab edit form that only exposed name. The problem picker used to attach problems SHALL display each candidate problem's code and creator alongside its title, so problems sharing a title can be told apart. Each attached problem's code and title in the list SHALL link to that problem's page.

#### Scenario: Editing all fields on a draft
- **WHEN** the creator changes name, description, start/end dates, privacy, and problem selection on a draft contest and saves
- **THEN** all changed fields are persisted

#### Scenario: Picking between same-titled problems
- **WHEN** the creator opens the problem picker and two or more candidate problems share the same title
- **THEN** each is shown with its distinct code and creator so the creator can identify the correct one before adding it

#### Scenario: Navigating to an attached problem from Settings
- **WHEN** the creator clicks an attached problem's code/title in the Settings problem list
- **THEN** they are taken to that problem's page

### Requirement: Publish action in Settings
For a draft contest, the Settings tab SHALL show a "Publish" action. Once a contest is published, the Publish action SHALL no longer be shown.

#### Scenario: Draft contest shows Publish
- **WHEN** the creator opens Settings for a draft contest
- **THEN** a "Publish" button is visible, disabled or annotated when required fields are missing

#### Scenario: Published contest hides Publish
- **WHEN** the creator opens Settings for an already-published contest
- **THEN** no "Publish" button is shown

### Requirement: Danger Zone relocated to Settings
The Danger Zone (contest deletion) SHALL appear only in the Settings tab, not in the Manage tab.

#### Scenario: Delete from Settings
- **WHEN** the creator opens the Settings tab for a contest eligible for deletion
- **THEN** a Danger Zone section with a delete action is shown
- **AND** the Manage tab (if shown) does not contain a Danger Zone section

### Requirement: Manage tab scoped to live operations
The Manage tab SHALL only be shown for `published` contests and SHALL contain only live-operations content: participant management, pending join requests, submissions, and data export. It SHALL NOT contain editable configuration fields or the Danger Zone.

#### Scenario: Manage tab on draft contest
- **WHEN** the creator opens a draft contest's page
- **THEN** no Manage tab is shown (only Settings, and Problems/Leaderboard as applicable)

#### Scenario: Manage tab on published contest
- **WHEN** the creator opens a published contest's page
- **THEN** a Manage tab is shown containing participants, pending joins (if private), submissions, and export — and no editable fields or Danger Zone
