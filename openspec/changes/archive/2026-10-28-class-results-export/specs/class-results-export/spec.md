## ADDED Requirements

### Requirement: Only the class owner can export detailed results
The system SHALL let only the class owner (`classroom.createdBy`) export a class's detailed results. Any other user, including joined members, SHALL be rejected and receive no data. The export SHALL be built on demand from current data each time it is requested.

#### Scenario: Owner exports
- **WHEN** the class owner requests the detailed results export of their class
- **THEN** the system SHALL return the CSV for that class

#### Scenario: Student requests the export
- **WHEN** a joined member who is not the owner requests the detailed results export
- **THEN** the system SHALL reject the request and return no rows

### Requirement: One row per student per published exercise
The export SHALL contain one header row and exactly one row for every pair of class student (members other than the owner) and exercise of a published lesson in the class, including pairs with no activity. Rows SHALL be ordered by student (name, then username), then lesson (creation order), then exercise (lesson order). Unpublished lessons SHALL NOT appear. Each row SHALL identify the student by name and username only (no email), and the exercise by lesson title, lesson due date, exercise position within the lesson (1-based), problem code and problem title.

#### Scenario: Two students, three exercises
- **WHEN** a class has 2 students and published lessons with 3 exercises in total, plus an unpublished lesson
- **THEN** the export SHALL have 6 data rows and none for the unpublished lesson's exercises

#### Scenario: Class without students or lessons
- **WHEN** a class has no students or no published lessons
- **THEN** the export SHALL contain only the header row

### Requirement: Lesson hand-in state per row
Each row SHALL carry the lesson's hand-in state for that student: `not_submitted` when no `lesson_submission` exists, `late` when it exists and the lesson has a due date earlier than `submittedAt`, otherwise `on_time`. It SHALL also carry the hand-in time and the review time (`reviewedAt`), empty when absent.

#### Scenario: Late hand-in
- **WHEN** a lesson is due on 2026-10-20 and the student handed it in on 2026-10-21
- **THEN** that student's rows for the lesson SHALL have state `late` and the hand-in timestamp

#### Scenario: Lesson without due date
- **WHEN** a lesson has no due date and the student handed it in
- **THEN** the state SHALL be `on_time`

### Requirement: Graded verdict and score come from the handed-in snapshot
For a handed-in lesson, each row SHALL report the submission snapshotted in `exercise_completion` for that exercise: its verdict (the raw `submission.status` code), passed test count, total test count, language and submission time, plus the score computed exactly as the gradebook does (`computeExerciseScore`). When the lesson was handed in but the exercise has no snapshotted submission, verdict and test counts SHALL be empty and the score SHALL be 0. When the lesson was not handed in, verdict, test counts, language, submission time and score SHALL all be empty. The teacher's feedback on that completion SHALL be included when present. Test counts SHALL be read from the judge report's `passed_count`/`total_tests` and SHALL be empty when the report is missing or unparseable.

#### Scenario: Wrong answer snapshot
- **WHEN** the snapshotted submission has status `WRONG_ANSWER` and passed 3 of 4 tests
- **THEN** the row SHALL show verdict `WRONG_ANSWER`, passed 3, total 4, score 0.75

#### Scenario: Score matches the gradebook
- **WHEN** the same class is viewed in the gradebook and exported in detail
- **THEN** every row's score SHALL equal the corresponding gradebook cell (empty where the cell is not submitted)

#### Scenario: Handed in without attempting the exercise
- **WHEN** the student handed in the lesson but never submitted that exercise
- **THEN** the row SHALL show empty verdict and test counts and score 0

### Requirement: Live activity per row
Independently of hand-in state, each row SHALL report the student's activity on that exercise: the number of submissions they made against it (`submission.exercise_id`), the time of the latest one (empty when none), and whether any of them has status `PASSED`.

#### Scenario: Work done but lesson not handed in
- **WHEN** a student made 4 submissions to an exercise, one of them passed, and never handed in the lesson
- **THEN** the row SHALL show state `not_submitted`, empty graded columns, attempts 4, the latest attempt time, and ever-passed `true`

#### Scenario: No activity
- **WHEN** a student never submitted an exercise
- **THEN** the row SHALL show attempts 0, empty last attempt time and ever-passed `false`

### Requirement: Export never exposes code or judge output
The detailed results data sent to the client SHALL contain only identifiers, names, usernames, titles, codes, statuses, counts, scores, languages, timestamps and the teacher's own feedback. It SHALL NOT contain submitted code, visual sources, raw judge output, test case inputs/outputs or student emails.

#### Scenario: Hidden tests stay hidden
- **WHEN** an exercise's problem has hidden test cases
- **THEN** the export SHALL contain only the passed/total counts for it, never test inputs, expected outputs or actual outputs

### Requirement: Detailed results file format
The file SHALL use the same CSV format as the gradebook export: RFC 4180 (every field quoted, embedded quotes doubled, CRLF rows), a UTF-8 BOM, formula-character neutralisation (`= + - @`), dot-decimal scores with at most 4 decimal places, ISO 8601 UTC timestamps, dates as `YYYY-MM-DD`, booleans as `true`/`false`, and stable English snake_case header names. The downloaded file SHALL be named `<class-slug>-results-<YYYY-MM-DD>.csv`.

#### Scenario: Download
- **WHEN** the owner chooses the detailed results export
- **THEN** the browser SHALL download `<class-slug>-results-<today>.csv` in that format

#### Scenario: Feedback with quotes and line breaks
- **WHEN** a teacher's feedback contains `"` and a newline
- **THEN** the field SHALL be quoted with the quote doubled and the newline preserved inside the field
