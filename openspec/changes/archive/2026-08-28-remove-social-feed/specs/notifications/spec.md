## REMOVED Requirements

### Requirement: Follow notification
**Reason**: The follow relationship is removed as part of WhyRunner's pivot to an educational platform.
**Migration**: None. `FOLLOW` is dropped from the `NotificationType` enum; existing `FOLLOW` notification rows are deleted by the migration before the enum is altered.

### Requirement: Activity like notification, aggregated per item
**Reason**: Activity-item likes are removed as part of the pivot.
**Migration**: None. `ACTIVITY_LIKE` is dropped from the `NotificationType` enum; existing rows deleted by the migration.

### Requirement: Activity comment notification, never aggregated
**Reason**: Activity-item comments are removed as part of the pivot.
**Migration**: None. `ACTIVITY_COMMENT` is dropped from the `NotificationType` enum; existing rows deleted by the migration.

### Requirement: Followed-user problem publish notification
**Reason**: Depends on the follow relationship, which is removed as part of the pivot.
**Migration**: None. `FOLLOWED_USER_PUBLISHED_PROBLEM` is dropped from the `NotificationType` enum; existing rows deleted by the migration.

## MODIFIED Requirements

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
