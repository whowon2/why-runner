## ADDED Requirements

### Requirement: Class owner can delete a class
The system SHALL allow the creator (`classroom.createdBy`) of a class to permanently delete it. Deleting a class SHALL cascade-delete its memberships, lessons, and all lesson-dependent data (exercises, exercise submissions, constraints) via existing database foreign-key cascades. Any user other than the creator SHALL be rejected.

#### Scenario: Owner deletes their own class
- **WHEN** the class owner requests deletion of a class they created
- **THEN** the classroom row and all dependent rows (memberships, lessons, exercises, submissions) are removed from the database

#### Scenario: Non-owner attempts to delete a class
- **WHEN** a user who is not the class's creator requests deletion of that class
- **THEN** the system rejects the request with a forbidden/error response and no rows are deleted

#### Scenario: Deletion of a nonexistent class
- **WHEN** a deletion is requested for a classroom id that does not exist
- **THEN** the system rejects the request with a not-found error

### Requirement: Class owner can remove a member
The system SHALL allow the creator of a class to remove a specific student's membership from that class. The class owner SHALL NOT be removable via this action (an owner has no removable membership row and must delete the class instead).

#### Scenario: Owner removes a student
- **WHEN** the class owner requests removal of a specific student who holds a membership in that class
- **THEN** that student's `classroomMembership` row is deleted and they no longer appear in the class roster or `listMyClasses`' joined list

#### Scenario: Non-owner attempts to remove a member
- **WHEN** a user who is not the class's creator requests removal of another member
- **THEN** the system rejects the request with a forbidden/error response and no membership row is deleted

#### Scenario: Owner attempts to remove themself
- **WHEN** the class owner requests removal of their own user id as a member
- **THEN** the system rejects the request, since ownership is not represented as a removable membership

### Requirement: Non-owner member can leave a class
The system SHALL allow a user who holds a membership in a class (and is not its creator) to remove their own membership from that class at any time.

#### Scenario: Member leaves a joined class
- **WHEN** a non-owner member of a class requests to leave it
- **THEN** their `classroomMembership` row for that class is deleted and the class no longer appears in their joined-classes list

#### Scenario: Owner attempts to leave their own class
- **WHEN** the class owner requests to leave the class they created
- **THEN** the system rejects the request, since the owner must delete the class instead of leaving it

#### Scenario: Leaving a class not joined
- **WHEN** a user requests to leave a class they hold no membership in
- **THEN** the system completes without error (idempotent no-op), consistent with `leaveContest`'s existing behavior for a non-membership delete
