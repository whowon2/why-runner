## ADDED Requirements

### Requirement: All notification types enabled by default
The system SHALL treat every notification type as enabled for every user unless that user has explicitly disabled it, requiring no per-user seed/backfill step when new notification types are introduced.

#### Scenario: New user has never touched preferences
- **WHEN** a user who has never opened notification settings triggers an event that would notify them
- **THEN** the system creates the notification, since the type is enabled by default

#### Scenario: New notification type ships after a user already exists
- **WHEN** a new notification type is added to the system after a user account already exists
- **THEN** that type is enabled by default for the existing user without any data migration

### Requirement: User can disable a specific notification type
The system SHALL let an authenticated user turn off a specific notification type, suppressing future notifications of that type without deleting notifications already created.

#### Scenario: Disabling a type
- **WHEN** an authenticated user turns off a notification type in settings
- **THEN** subsequent events of that type do not create new notifications for that user, and existing notifications of that type remain in their inbox unchanged

#### Scenario: Re-enabling a type
- **WHEN** an authenticated user turns a previously disabled notification type back on
- **THEN** subsequent events of that type create notifications for that user again

### Requirement: Notification settings section lists every type grouped by module
The `/settings` page SHALL include a Notifications section listing every notification type, grouped by the module it belongs to (Social, Contests, Submissions, Problems, Lessons), each with its own on/off control reflecting the user's current preference.

#### Scenario: Opening the notifications settings section
- **WHEN** an authenticated user opens the Notifications section of settings
- **THEN** every notification type is shown grouped under its module heading, each toggle showing its current enabled/disabled state (all "on" for a user who has never changed anything)

#### Scenario: Toggling a type persists immediately
- **WHEN** a user flips a notification type's toggle in settings
- **THEN** the new preference is saved without requiring a separate "Save" action, and the toggle reflects the saved state on reload

### Requirement: Preference enforcement happens at creation time
The system SHALL check the recipient's preference for a notification type before creating that notification, for every trigger path including the submission-grading trigger that runs outside the web application process.

#### Scenario: Disabled type suppresses application-triggered notifications
- **WHEN** a user has disabled `ACTIVITY_LIKE` and receives a like on their activity post
- **THEN** no `ACTIVITY_LIKE` notification is created for them

#### Scenario: Disabled type suppresses the database-triggered submission notification
- **WHEN** a user has disabled `SUBMISSION_GRADED` and one of their submissions transitions to `PASSED`, `FAILED`, or `ERROR`
- **THEN** no `SUBMISSION_GRADED` notification is created for them, even though the transition is written by the judge process outside the web app
