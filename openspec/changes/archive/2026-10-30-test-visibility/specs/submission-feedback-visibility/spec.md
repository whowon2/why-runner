## MODIFIED Requirements

### Requirement: Hidden test failures show only the verdict in practice and contests
For practice and contest submissions viewed by anyone other than the problem's creator, the rule depends on the failing test:
- A failure on a sample test (a test whose `visible` flag is `true`, per the test-case-visibility capability) SHALL show the full detail.
- A failure on a hidden test SHALL show only the verdict kind (wrong answer, runtime error, time limit, constraint violation), the test number, and the passed/total counts. It SHALL NOT include the input, the expected output, the actual output, or stderr.

Compile errors SHALL always show the compiler output, since it does not depend on test input.

This applies to the contest owner too, unless they also created the problem.

#### Scenario: Wrong answer on a sample
- **WHEN** a student's practice submission fails test 1 and the problem has `visible = [true, true, false]`
- **THEN** the student SHALL see test 1's input, expected output, and their output

#### Scenario: Wrong answer on a non-leading sample
- **WHEN** a student's practice submission fails test 3 and the problem has `visible = [false, false, true]`
- **THEN** the student SHALL see test 3's input, expected output, and their output

#### Scenario: Wrong answer on a hidden test
- **WHEN** a student's contest submission fails test 5 and the problem has `visible = [true, true, false, false, false]`
- **THEN** the student SHALL see "Wrong answer on test 5" and the passed count, and SHALL NOT see the input, expected output, their actual output, or stderr

#### Scenario: Runtime error on a hidden test does not leak via stderr
- **WHEN** a student's code prints the test input to stderr and then crashes on hidden test 4
- **THEN** the student SHALL see "Runtime error on test 4" without stderr

#### Scenario: Compile error
- **WHEN** a submission fails to compile
- **THEN** the student SHALL see the compiler output

#### Scenario: Contest owner who does not own the problem
- **WHEN** a contest owner views a participant's submission to a problem created by someone else
- **THEN** a failure on a hidden test SHALL be redacted for them as for a student

## ADDED Requirements

### Requirement: Lesson exercise reports follow the lesson's test visibility
For lesson exercise submissions, the failing test SHALL be shown in full (input, expected output, actual output, stderr) only when the test-case-visibility rule says that the viewer may see that test under the lesson's `testVisibility`. Otherwise it SHALL be redacted exactly like a hidden practice/contest failure: the verdict, the test number and the pass counts, plus compiler output for compile errors. There SHALL be no partially redacted state where the input is shown without the expected output. The problem's author, the lesson's owner and the classroom's owner SHALL see the full report.

#### Scenario: problem_default, failure on a visible test
- **WHEN** a student's exercise submission fails test 2, the lesson is `problem_default`, and test 2 is visible
- **THEN** the student SHALL see test 2's input, expected output and their output

#### Scenario: problem_default, failure on a hidden test
- **WHEN** a student's exercise submission fails test 4, the lesson is `problem_default`, and test 4 is hidden
- **THEN** the student SHALL see "Test 4 failed (hidden)" style verdict text with the pass counts, and no input, expected output, actual output or stderr

#### Scenario: show_all lesson
- **WHEN** the lesson is `show_all`
- **THEN** a student SHALL see the full report for a failure on any test

#### Scenario: hide_all lesson
- **WHEN** the lesson is `hide_all`
- **THEN** a student SHALL see only the verdict, the test number and the pass counts for a failure on any test, plus compiler output on a compile error

#### Scenario: Lesson owner
- **WHEN** the lesson owner views a student's failing exercise submission in a `hide_all` lesson
- **THEN** they SHALL see the full report

### Requirement: Exercise submissions render the failing-test report
The exercise page's submission list SHALL render each judged submission's report with the same component used for contest submissions. It SHALL show all tests passed, the failing test's input, expected output and actual output, stderr, a constraint violation, or the hidden-test notice, as redacted for the viewer, alongside the submitted code.

#### Scenario: Student expands a failing submission
- **WHEN** a student expands a wrong-answer submission on a visible test in the exercise submission list
- **THEN** they SHALL see the code, the failing test number, the pass counts, the input, their output and the expected output

#### Scenario: Student expands a hidden-test failure
- **WHEN** a student expands a submission that failed a hidden test
- **THEN** they SHALL see the hidden-test notice with the verdict, test number and pass counts

#### Scenario: Passed submission
- **WHEN** a student expands a passed submission
- **THEN** they SHALL see that all N tests passed

## REMOVED Requirements

### Requirement: Lesson exercise reports follow the lesson's output visibility
**Reason**: `lesson.showOutputs` is replaced by `lesson.testVisibility`. The old rule always showed exercise inputs, which leaked hidden tests, and only toggled the expected output.
**Migration**: See "Lesson exercise reports follow the lesson's test visibility". Lessons with `showOutputs = true` become `show_all`, and lessons with `false` become `problem_default`.
