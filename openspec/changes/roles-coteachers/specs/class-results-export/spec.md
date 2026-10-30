## MODIFIED Requirements

### Requirement: Only the class owner can export detailed results
The system SHALL let only class managers (the owner `classroom.createdBy`, co-teachers and admins) export a class's detailed results. Students and non-members SHALL be rejected and receive no data. The export SHALL be built on demand from current data each time it is requested.

#### Scenario: Owner exports
- **WHEN** the class owner requests the detailed results export of their class
- **THEN** the system SHALL return the CSV for that class

#### Scenario: Co-teacher exports
- **WHEN** a co-teacher requests the detailed results export
- **THEN** the system SHALL return the CSV for that class

#### Scenario: Student requests the export
- **WHEN** a joined member with role `student` requests the detailed results export
- **THEN** the system SHALL reject the request and return no rows

### Requirement: One row per student per published exercise
The export SHALL contain one header row and exactly one row for every pair of class student (members with role `student` other than the owner) and exercise of a published lesson in the class, including pairs with no activity. Rows SHALL be ordered by student (name, then username), then lesson (creation order), then exercise (lesson order). Unpublished lessons SHALL NOT appear. Each row SHALL identify the student by name and username only (no email), and the exercise by lesson title, lesson due date, exercise position within the lesson (1-based), problem code and problem title.

#### Scenario: Two students, three exercises
- **WHEN** a class has 2 students and published lessons with 3 exercises in total, plus an unpublished lesson
- **THEN** the export SHALL have 6 data rows and none for the unpublished lesson's exercises

#### Scenario: Class without students or lessons
- **WHEN** a class has no students or no published lessons
- **THEN** the export SHALL contain only the header row

#### Scenario: Co-teacher excluded
- **WHEN** a class has 2 students, 1 co-teacher and 3 published exercises
- **THEN** the export SHALL have 6 data rows
