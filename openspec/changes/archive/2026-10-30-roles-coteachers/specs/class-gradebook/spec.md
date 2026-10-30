## MODIFIED Requirements

### Requirement: Class owner can open a gradebook
The system SHALL provide a gradebook page for each class, reachable from the class page, that only class managers (the owner `classroom.createdBy`, co-teachers and admins) can load. Students and non-members SHALL be rejected and the entry point SHALL NOT be shown to them.

#### Scenario: Owner opens the gradebook
- **WHEN** the class owner opens the gradebook of their class
- **THEN** the system SHALL display the class's gradebook matrix

#### Scenario: Co-teacher opens the gradebook
- **WHEN** a co-teacher opens the gradebook of the class
- **THEN** the system SHALL display the class's gradebook matrix

#### Scenario: Student tries to load the gradebook
- **WHEN** a joined member with role `student` requests the gradebook data
- **THEN** the system SHALL reject the request and return no scores

### Requirement: Gradebook matrix lists students against published lesson exercises
The gradebook SHALL have one row per class student (members with role `student` other than the owner, ordered by name) and one column per exercise of every published lesson in the class, grouped by lesson (lessons by creation order, exercises by their lesson order). Unpublished lessons SHALL NOT appear. Students SHALL be returned with public user columns plus their `ra` (no email). Each student's row SHALL show their RA alongside their name, or nothing when they have none.

#### Scenario: Class with two published lessons and one draft
- **WHEN** a class has published lessons A (2 exercises) and B (1 exercise) and an unpublished lesson C
- **THEN** the gradebook SHALL show 3 exercise columns grouped under A and B, and none for C

#### Scenario: Student RA shown
- **WHEN** a student with RA `0064019` is in the class
- **THEN** their gradebook row SHALL show `0064019` next to their name

#### Scenario: Co-teacher is not a row
- **WHEN** the class has a co-teacher
- **THEN** the gradebook SHALL have no row for them
