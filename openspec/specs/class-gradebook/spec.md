# class-gradebook Specification

## Purpose
TBD - created by archiving change class-gradebook-export. Update Purpose after archive.
## Requirements
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

### Requirement: Cell score reuses lesson grading
Each cell SHALL show the student's score for that exercise computed exactly as lesson review does: the passed test-case fraction (`passed_count / total_tests`) of the submission snapshotted for that exercise when the student submitted the lesson. A cell SHALL be empty ("not submitted") when the student has not submitted that lesson, and SHALL be 0 when the lesson was submitted but that exercise has no snapshotted or parseable submission. The score SHALL NOT depend on specific submission status values.

#### Scenario: Partially passing exercise
- **WHEN** a student submitted the lesson and the exercise's snapshotted submission passed 3 of 4 test cases
- **THEN** that cell SHALL show 0.75

#### Scenario: Lesson not submitted
- **WHEN** a student has not submitted the lesson
- **THEN** every cell of that lesson for the student SHALL be shown as not submitted rather than 0

### Requirement: Gradebook shows lesson subtotals and student totals
For each student and lesson, the gradebook SHALL show a lesson subtotal equal to the sum of that lesson's exercise scores (the lesson-total rule from lesson grading), empty when the lesson was not submitted. For each student, it SHALL show an overall total equal to the sum of all their exercise scores (not-submitted counting as 0) out of the total number of exercise columns.

#### Scenario: Totals across lessons
- **WHEN** a student scored 0.5 and 1.0 in lesson A and did not submit lesson B (1 exercise)
- **THEN** lesson A's subtotal SHALL be 1.5, lesson B's subtotal SHALL be empty, and the overall total SHALL be 1.5 out of 3

### Requirement: Gradebook can be exported as CSV
The class owner SHALL be able to download the gradebook as a CSV file containing one header row and one row per student with: student name, username, RA (header `ra`, empty when absent, written as text with leading zeros kept), one column per exercise (headed by lesson and problem title), one subtotal column per lesson, the overall total, and the maximum possible total. Scores SHALL be written as decimals with a dot separator; not-submitted cells SHALL be empty. The file SHALL be RFC 4180 (every field quoted, embedded quotes doubled, CRLF rows), start with a UTF-8 BOM, and neutralise cells starting with formula characters (`= + - @`). The gradebook's export control SHALL offer two choices: this scores CSV, and the detailed results CSV defined by `class-results-export`.

#### Scenario: Download CSV
- **WHEN** the owner opens the export menu on the gradebook and chooses the scores export
- **THEN** the browser SHALL download a `.csv` file whose rows match the gradebook on screen

#### Scenario: RA column keeps leading zeros
- **WHEN** a student with RA `0064019` is exported
- **THEN** that row's `ra` field SHALL be `"0064019"`, and a student without an RA SHALL have an empty `ra` field

#### Scenario: Choose detailed results
- **WHEN** the owner opens the export menu on the gradebook and chooses the detailed results export
- **THEN** the browser SHALL download the class's detailed results CSV

#### Scenario: Student name looks like a formula
- **WHEN** a student's name starts with `=`
- **THEN** the exported cell SHALL be prefixed so spreadsheet apps do not evaluate it

