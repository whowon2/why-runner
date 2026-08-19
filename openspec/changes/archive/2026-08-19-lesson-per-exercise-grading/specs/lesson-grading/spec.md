## ADDED Requirements

### Requirement: Judge runs every test case for exercise submissions
When a submission is made against a lesson exercise (as opposed to a contest or standalone/practice submission), the judge SHALL execute every declared input/output pair for the problem, rather than stopping at the first failing test case, so `passed_count`/`total_tests` reflect the true number of test cases the submission gets right. Contest and standalone/practice submissions SHALL continue to stop at the first failing test case, unchanged.

#### Scenario: Exercise submission fails an early test but passes a later one
- **WHEN** a student submits code against a lesson exercise, and the code fails test case 2 but would pass test cases 3, 4, and 5
- **THEN** the judge SHALL run test cases 3, 4, and 5 despite the failure at test case 2, and the resulting `passed_count` SHALL count all test cases the submission actually passed

#### Scenario: Contest submission still stops at first failure
- **WHEN** a student submits code in a contest and the code fails test case 2
- **THEN** the judge SHALL stop after test case 2 and SHALL NOT run subsequent test cases, exactly as before this change

#### Scenario: Compile error short-circuits regardless of submission type
- **WHEN** a submission (exercise or otherwise) fails to compile
- **THEN** the judge SHALL stop immediately without running any test case, since a compile error applies identically to every test case

### Requirement: Exercise page shows declared test-case inputs
The exercise page SHALL display every declared test-case input for the exercise's problem before the student submits, so students can see edge cases the problem is graded against.

#### Scenario: Student views an exercise
- **WHEN** a student opens an exercise page
- **THEN** the system SHALL display the problem's declared test-case inputs

### Requirement: Lesson-level toggle controls test-case output visibility
A lesson SHALL have a `showOutputs` setting, defaulting to off, that the lesson's owner can toggle. When on, the exercise page SHALL also display each test case's expected output alongside its input, for every exercise in that lesson. When off, expected outputs SHALL NOT be shown on the exercise page.

#### Scenario: Owner enables output visibility
- **WHEN** the lesson owner turns on `showOutputs` for their lesson
- **THEN** every exercise in that lesson SHALL display expected outputs alongside inputs on its exercise page

#### Scenario: Default hides outputs
- **WHEN** a lesson is created without changing `showOutputs`
- **THEN** exercise pages for that lesson SHALL show test-case inputs only, not expected outputs

### Requirement: Per-exercise score is derived from judge results
For a student's submitted lesson, each exercise's score SHALL be computed as the fraction of test cases passed (`passed_count / total_tests`) from that exercise's snapshotted submission result, rather than manually set by the professor.

#### Scenario: Professor reviews a submitted lesson
- **WHEN** a professor opens the review page for a student's submitted lesson
- **THEN** the system SHALL display, for each exercise, a score computed as that exercise's passed test-case fraction from the student's snapshotted submission

### Requirement: Professor leaves feedback per exercise
The professor SHALL be able to attach free-text feedback to a specific student's specific exercise within a submitted lesson, independent of any other exercise's feedback.

#### Scenario: Professor writes feedback on one exercise
- **WHEN** a professor writes feedback text for a student's answer to one exercise in a submitted lesson
- **THEN** the system SHALL persist that feedback text scoped to that student and that exercise only, without affecting other exercises' feedback

### Requirement: Lesson-total score sums each exercise's normalized fraction
A student's lesson-total score SHALL be the sum, across every exercise in the lesson, of that exercise's passed test-case fraction — giving every exercise equal weight regardless of how many test cases its problem declares.

#### Scenario: Lesson with exercises of differing test-case counts
- **WHEN** a lesson has two exercises, one with 10 test cases (student passes 5) and one with 2 test cases (student passes 2)
- **THEN** the lesson-total score SHALL be 0.5 + 1.0 = 1.5, not weighted by each exercise's raw test-case count
