## Purpose

Defines the notifications a user receives for social, contest, submission, problem, and lesson events, including per-type aggregation rules, the actor-never-notifies-self guard, and the notification inbox (unread count, mark-as-read, navigation to the referenced entity).

## Requirements

### Requirement: Contest join request notification
The system SHALL notify a private contest's owner when a user requests to join it.

#### Scenario: Join request on a private contest
- **WHEN** a user requests to join a private contest they don't already belong to
- **THEN** the system creates a `CONTEST_JOIN_REQUEST` notification for the contest's owner referencing that contest and requester

#### Scenario: Public contest join creates no request notification
- **WHEN** a user joins a public (non-private) contest
- **THEN** no `CONTEST_JOIN_REQUEST` notification is created, since public joins are auto-accepted

### Requirement: Contest join response notification
The system SHALL notify a user who requested to join a private contest when the contest owner approves or rejects that request.

#### Scenario: Join request approved
- **WHEN** a contest owner approves a pending join request
- **THEN** the system creates a `CONTEST_JOIN_APPROVED` notification for the requester referencing that contest

#### Scenario: Join request rejected
- **WHEN** a contest owner rejects a pending join request
- **THEN** the system creates a `CONTEST_JOIN_REJECTED` notification for the requester referencing that contest

### Requirement: Submission graded notification
The system SHALL notify a user when their code submission finishes grading (transitions to `PASSED`, `FAILED`, or `ERROR`), regardless of which process performed the write.

#### Scenario: Submission passes
- **WHEN** a submission's status transitions to `PASSED`
- **THEN** the system creates a `SUBMISSION_GRADED` notification for the submitting user referencing that submission and problem, stating it passed

#### Scenario: Submission fails or errors
- **WHEN** a submission's status transitions to `FAILED` or `ERROR`
- **THEN** the system creates a `SUBMISSION_GRADED` notification for the submitting user referencing that submission and problem, stating the outcome

#### Scenario: Intermediate status transitions are silent
- **WHEN** a submission's status transitions to `PENDING` or `RUNNING`
- **THEN** no `SUBMISSION_GRADED` notification is created

### Requirement: Lesson unlocked notification
The system SHALL notify a user when a new roadmap lesson becomes available to them.

#### Scenario: A lesson's requirements are newly met
- **WHEN** a user's skill/language progress causes a previously locked lesson to become unlocked for them
- **THEN** the system creates a `LESSON_UNLOCKED` notification for that user referencing the newly unlocked lesson

#### Scenario: Already-unlocked lesson does not re-notify
- **WHEN** a lesson that was already unlocked for a user remains unlocked after a progress update
- **THEN** no additional notification is created

### Requirement: Actor never notified of their own action
The system SHALL never create a notification whose recipient is the same user who performed the triggering action, across all notification types.

#### Scenario: Any self-triggered event
- **WHEN** any notification-eligible event's actor and intended recipient are the same user
- **THEN** the system creates no notification for that event

### Requirement: Notification inbox with read state
The system SHALL provide an inbox listing the current user's notifications, most recent first, with an unread count and the ability to mark individual or all notifications as read. Selecting a notification SHALL navigate the user directly to the entity it refers to (submission, contest, or problem) instead of a generic fallback location.

#### Scenario: Unread count
- **WHEN** a user has unread notifications
- **THEN** the system reports the correct unread count for display on the notification bell

#### Scenario: Mark one as read
- **WHEN** a user opens or acknowledges a single notification
- **THEN** that notification is marked read and no longer counted as unread

#### Scenario: Mark all as read
- **WHEN** a user triggers "mark all as read"
- **THEN** every currently unread notification for that user becomes read

#### Scenario: Selecting a submission-graded notification
- **WHEN** a user selects a `SUBMISSION_GRADED` notification
- **THEN** the system navigates to that submission's result view
</content>
