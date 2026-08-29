## MODIFIED Requirements

### Requirement: Notification settings section lists every type grouped by module
The `/settings` page SHALL include a Notifications section listing every notification type, grouped by the module it belongs to (Contests, Submissions, Lessons), each with its own on/off control reflecting the user's current preference.

#### Scenario: Opening the notifications settings section
- **WHEN** an authenticated user opens the Notifications section of settings
- **THEN** every notification type is shown grouped under its module heading, each toggle showing its current enabled/disabled state (all "on" for a user who has never changed anything)

#### Scenario: Toggling a type persists immediately
- **WHEN** a user flips a notification type's toggle in settings
- **THEN** the new preference is saved without requiring a separate "Save" action, and the toggle reflects the saved state on reload

### Requirement: Preference enforcement happens at creation time
The system SHALL check the recipient's preference for a notification type before creating that notification, for every trigger path including the submission-grading trigger that runs outside the web application process.

#### Scenario: Disabled type suppresses the database-triggered submission notification
- **WHEN** a user has disabled `SUBMISSION_GRADED` and one of their submissions transitions to `PASSED`, `FAILED`, or `ERROR`
- **THEN** no `SUBMISSION_GRADED` notification is created for them, even though the transition is written by the judge process outside the web app

#### Scenario: Disabled type suppresses an application-triggered notification
- **WHEN** a user has disabled `CONTEST_JOIN_REQUEST` and receives a join request on a private contest they own
- **THEN** no `CONTEST_JOIN_REQUEST` notification is created for them
