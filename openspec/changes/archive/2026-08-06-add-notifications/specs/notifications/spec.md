## ADDED Requirements

### Requirement: Follow notification
The system SHALL notify a user when another user follows them, aggregating repeated new followers into the same unread notification with a running count.

#### Scenario: New follower
- **WHEN** user A follows user B
- **THEN** the system creates or updates a `FOLLOW` notification for user B naming user A as an actor

#### Scenario: Additional follower while unread
- **WHEN** user B already has an unread `FOLLOW` notification and a different user C also follows user B
- **THEN** the system increments that notification's count and adds user C to its actor list instead of creating a new notification

#### Scenario: Self-follow guard
- **WHEN** a follow action would target the same user as the actor
- **THEN** no notification is created (self-follow is already rejected by the follow feature)

### Requirement: Activity like notification, aggregated per item
The system SHALL notify the owner of an activity feed post when it receives likes, aggregating multiple likes on the same unread notification for that post into a single entry with a running count.

#### Scenario: First like on an activity post
- **WHEN** an activity post receives its first like since the owner last read notifications for it
- **THEN** the system creates a new `ACTIVITY_LIKE` notification with count 1 and the liker as the sole actor

#### Scenario: Additional like while unread
- **WHEN** an activity post already has an unread like notification and receives another like
- **THEN** the system increments that notification's count and adds the new liker to its actor list

#### Scenario: Like after previous notification was read
- **WHEN** an activity post receives a like and the owner has already read the previous like notification for it
- **THEN** the system creates a fresh notification with count 1 rather than reopening the read one

#### Scenario: Unlike decrements or removes an unread notification
- **WHEN** a user removes a like whose notification is still unread
- **THEN** the system decrements the count and removes that user from the actor list, deleting the notification entirely if the count would drop to 0

#### Scenario: Self-like guard
- **WHEN** a user likes their own activity post
- **THEN** no notification is created

### Requirement: Activity comment notification, never aggregated
The system SHALL create one distinct notification per comment on a user's activity post, never merged with other comment notifications even when several arrive close together.

#### Scenario: Single comment
- **WHEN** a user comments on another user's activity post
- **THEN** the system creates a new `ACTIVITY_COMMENT` notification for the owner naming the commenter and referencing that specific comment

#### Scenario: Multiple comments from different users
- **WHEN** three different users each comment on the same activity post
- **THEN** the system creates three separate notifications, one per comment

#### Scenario: Self-comment guard
- **WHEN** a user comments on their own activity post
- **THEN** no notification is created

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

### Requirement: Followed-user problem publish notification
The system SHALL notify a user's followers when that user publishes a new problem.

#### Scenario: Followed creator publishes a problem
- **WHEN** a user with at least one follower publishes a problem
- **THEN** the system creates a `FOLLOWED_USER_PUBLISHED_PROBLEM` notification for each follower referencing the publisher and the new problem

#### Scenario: Creator with no followers publishes a problem
- **WHEN** a user with no followers publishes a problem
- **THEN** no notifications are created

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
The system SHALL provide an inbox listing the current user's notifications, most recent first, with an unread count and the ability to mark individual or all notifications as read. Selecting a notification SHALL navigate the user directly to the entity it refers to (submission, contest, activity post, profile, or problem) instead of a generic fallback location.

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

#### Scenario: Selecting a follow notification
- **WHEN** a user selects a `FOLLOW` notification
- **THEN** the system navigates to the follower's profile (or, if aggregated, the most recent follower's profile)
