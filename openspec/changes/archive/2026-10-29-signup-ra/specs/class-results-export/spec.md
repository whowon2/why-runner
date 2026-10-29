## MODIFIED Requirements

### Requirement: One row per student per published exercise
The export SHALL contain one header row and exactly one row for every pair of class student (members other than the owner) and exercise of a published lesson in the class, including pairs with no activity. Rows SHALL be ordered by student (name, then username), then lesson (creation order), then exercise (lesson order). Unpublished lessons SHALL NOT appear. Each row SHALL identify the student by name, username and RA only (no email). The RA goes in an `ra` column directly after `username`, empty when the student has none. Each row SHALL identify the exercise by lesson title, lesson due date, exercise position within the lesson (1-based), problem code and problem title.

#### Scenario: Two students, three exercises
- **WHEN** a class has 2 students and published lessons with 3 exercises in total, plus an unpublished lesson
- **THEN** the export SHALL have 6 data rows and none for the unpublished lesson's exercises

#### Scenario: Class without students or lessons
- **WHEN** a class has no students or no published lessons
- **THEN** the export SHALL contain only the header row

#### Scenario: Student RA in every row
- **WHEN** a student with RA `0064019` has rows in the export
- **THEN** each of their rows SHALL have `ra` = `"0064019"`

### Requirement: Export never exposes code or judge output
The detailed results data sent to the client SHALL contain only identifiers, names, usernames, RAs, titles, codes, statuses, counts, scores, languages, timestamps and the teacher's own feedback. It SHALL NOT contain submitted code, visual sources, raw judge output, test case inputs/outputs or student emails.

#### Scenario: Hidden tests stay hidden
- **WHEN** an exercise's problem has hidden test cases
- **THEN** the export SHALL contain only the passed/total counts for it, never test inputs, expected outputs or actual outputs
