## MODIFIED Requirements

### Requirement: Gradebook matrix lists students against published lesson exercises
The gradebook SHALL have one row per class student (members other than the owner, ordered by name) and one column per exercise of every published lesson in the class, grouped by lesson (lessons by creation order, exercises by their lesson order). Unpublished lessons SHALL NOT appear. Students SHALL be returned with public user columns plus their `ra` (no email). Each student's row SHALL show their RA alongside their name, or nothing when they have none.

#### Scenario: Class with two published lessons and one draft
- **WHEN** a class has published lessons A (2 exercises) and B (1 exercise) and an unpublished lesson C
- **THEN** the gradebook SHALL show 3 exercise columns grouped under A and B, and none for C

#### Scenario: Student RA shown
- **WHEN** a student with RA `0064019` is in the class
- **THEN** their gradebook row SHALL show `0064019` next to their name

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
