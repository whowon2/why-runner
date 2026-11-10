## Purpose

Defines the class (classroom) lifecycle: how a teacher creates, updates, deletes, and manages membership in a class, and how a student joins and leaves one.
## Requirements
### Requirement: Class owner can delete a class
The system SHALL allow the creator (`classroom.createdBy`) of a class, or an admin, to permanently delete it. Deleting a class SHALL cascade-delete its memberships, lessons, and all lesson-dependent data (exercises, exercise submissions, constraints) via existing database foreign-key cascades. Any other user, including co-teachers, SHALL be rejected.

#### Scenario: Owner deletes their own class
- **WHEN** the class owner requests deletion of a class they created
- **THEN** the classroom row and all dependent rows (memberships, lessons, exercises, submissions) are removed from the database

#### Scenario: Admin deletes a class
- **WHEN** an admin requests deletion of a class they did not create
- **THEN** the class and its dependent rows are removed

#### Scenario: Non-owner attempts to delete a class
- **WHEN** a user who is neither the class's creator nor an admin (including a co-teacher) requests deletion of that class
- **THEN** the system rejects the request with a forbidden/error response and no rows are deleted

#### Scenario: Deletion of a nonexistent class
- **WHEN** a deletion is requested for a classroom id that does not exist
- **THEN** the system rejects the request with a not-found error

### Requirement: Class owner can remove a member
The system SHALL allow class managers (owner, co-teachers, admins) to remove a student's membership from a class. Removing a co-teacher's membership SHALL be allowed only to the owner or an admin. The class owner SHALL NOT be removable via this action (an owner must delete the class instead).

#### Scenario: Owner removes a student
- **WHEN** the class owner requests removal of a specific student who holds a membership in that class
- **THEN** that student's `classroomMembership` row is deleted and they no longer appear in the class roster or `listMyClasses`' joined list

#### Scenario: Co-teacher removes a student
- **WHEN** a co-teacher requests removal of a student
- **THEN** that student's membership row is deleted

#### Scenario: Co-teacher removes another co-teacher
- **WHEN** a co-teacher requests removal of a member with role `teacher`
- **THEN** the system rejects the request and no row is deleted

#### Scenario: Non-owner attempts to remove a member
- **WHEN** a student or non-member requests removal of another member
- **THEN** the system rejects the request with a forbidden/error response and no membership row is deleted

#### Scenario: Owner attempts to remove themself
- **WHEN** anyone requests removal of the class owner's user id as a member
- **THEN** the system rejects the request, since ownership is not represented as a removable membership

### Requirement: Non-owner member can leave a class
The system SHALL allow a user who holds a membership in a class (student or co-teacher, but not its creator) to remove their own membership from that class at any time.

#### Scenario: Member leaves a joined class
- **WHEN** a non-owner member of a class requests to leave it
- **THEN** their `classroomMembership` row for that class is deleted and the class no longer appears in their class list

#### Scenario: Co-teacher leaves
- **WHEN** a co-teacher requests to leave the class
- **THEN** their membership is deleted and they lose manager access

#### Scenario: Owner attempts to leave their own class
- **WHEN** the class owner requests to leave the class they created
- **THEN** the system rejects the request, since the owner must delete the class instead of leaving it

#### Scenario: Leaving a class not joined
- **WHEN** a user requests to leave a class they hold no membership in
- **THEN** the system completes without error (idempotent no-op), consistent with `leaveContest`'s existing behavior for a non-membership delete

### Requirement: Class roster is ordered by name, teachers first
For class managers, the class page SHALL list the class's teachers before its students: the owner first, then co-teachers, then students. Co-teachers and students SHALL each be ordered by name using pt-BR collation that ignores case and accents, with ties broken by username. Join date SHALL NOT affect the order.

#### Scenario: Students listed alphabetically regardless of join order
- **WHEN** students "Zé", "ana" and "Álvaro" joined a class in that order
- **THEN** the students list SHALL show "Álvaro", "ana", "Zé"

#### Scenario: Teachers listed before students
- **WHEN** a class has an owner, co-teacher "Bruno" and student "Ana"
- **THEN** the owner and "Bruno" SHALL appear in the teachers list above the students list containing "Ana"

#### Scenario: Same name tiebreak
- **WHEN** two students are both named "Maria Silva" with usernames `msilva2` and `msilva1`
- **THEN** `msilva1` SHALL be listed before `msilva2`

### Requirement: Create-class control is separate from the join form
The classes page SHALL NOT place the create-class control next to the join-code form. When the user teaches at least one class, the control SHALL appear next to the "classes you teach" section heading. When the user teaches no class, the control SHALL appear in a separate box below the class lists, with a hint explaining that teachers create a class and invite students with its code. The `?createClass=1` query parameter SHALL still create a class and open it.

#### Scenario: User who teaches classes
- **WHEN** a user who owns or co-teaches at least one class opens `/classes`
- **THEN** the create-class button appears beside the "classes you teach" heading and not beside the join form

#### Scenario: User who teaches no class
- **WHEN** a user who teaches no class opens `/classes`
- **THEN** the header shows only the join form, and the create-class button appears in a separate dashed box with the teaching hint

#### Scenario: Query trigger
- **WHEN** a user opens `/classes?createClass=1`
- **THEN** exactly one class is created and the user is redirected to it; `?createClass=true` behaves the same

### Requirement: Class detail header layout
The class detail page SHALL render the class name, icon badge and student count through the shared `PageHeader` with no inline actions, so the name uses the full content width. Teacher actions SHALL appear in a toolbar row below the header: a compact copyable class-code chip, a Gradebook link, a primary (filled) Create assignment button, and an overflow menu holding Edit class, Leave class (co-teachers only) and Delete class (owner-level only, destructive style). Members without manage rights SHALL see only a Leave class action in that toolbar. The header and toolbar SHALL NOT overflow the content width at any viewport width down to 360px.

#### Scenario: Long class name wraps at full width
- **WHEN** a teacher opens a class named "Programação 1 - TecInfo1 - 2026" on a desktop viewport
- **THEN** the name renders on one line (or wraps across the full content width), not word by word in a narrow column

#### Scenario: Destructive actions live in the overflow menu
- **WHEN** the class owner opens the class detail page
- **THEN** no Delete class button is visible in the toolbar, and opening the ellipsis menu shows Edit class and a destructive-styled Delete class item that opens the existing confirmation dialog

#### Scenario: Copy class code from the chip
- **WHEN** a teacher clicks the class-code chip
- **THEN** the join code is copied to the clipboard and a confirmation toast appears

#### Scenario: Mobile width has no horizontal overflow
- **WHEN** the page is viewed at 375px wide
- **THEN** the toolbar wraps onto extra lines and the document has no horizontal scroll

