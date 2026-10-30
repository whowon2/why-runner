## Purpose

Defines how lesson exercises are graded end-to-end: the judge runs every declared test case (rather than stopping at the first failure) for exercise submissions, students can see declared test-case inputs (and, if the lesson owner opts in, expected outputs) before submitting, and per-exercise/lesson-total scores are derived automatically from judge results rather than set manually by the professor, who instead attaches free-text feedback per exercise.
## Requirements
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
The exercise page SHALL display, before the student submits, the test cases that the viewer may see under the lesson's `testVisibility` (per the test-case-visibility capability), each with its input and expected output, so students can see the edge cases the problem is graded against without hidden tests being revealed.

#### Scenario: Student views an exercise
- **WHEN** a student opens an exercise page in a `problem_default` lesson
- **THEN** the system SHALL display the input and expected output of each test marked visible on the problem, and the number of hidden tests

#### Scenario: Student views an exercise in a show_all lesson
- **WHEN** a student opens an exercise page in a `show_all` lesson
- **THEN** the system SHALL display every test case's input and expected output

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

